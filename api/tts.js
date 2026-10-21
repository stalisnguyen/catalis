// Natural English speech, locked by APP_PASSWORD.
// Uses Azure Speech when AZURE_SPEECH_KEY + AZURE_SPEECH_REGION are set, otherwise Groq Orpheus (GROQ_API_KEY).
// Fixed app texts never come here: they are pre-generated Kokoro files (audio/t, audio/l). Responses are cacheable, so each line is
// synthesised once and then served from the CDN / browser cache.
//   POST {text, lang:'en-GB'|'en-AU'|'en-US', voice:'f'|'m'|'f2'|'m2', rate:0.6..1.3} -> audio/mpeg
const { checkKey } = require('./_lib');

const VOICES = {
  'en-GB': { f: 'en-GB-SoniaNeural', m: 'en-GB-RyanNeural', f2: 'en-GB-LibbyNeural', m2: 'en-GB-ThomasNeural' },
  'en-AU': { f: 'en-AU-NatashaNeural', m: 'en-AU-WilliamNeural', f2: 'en-AU-NatashaNeural', m2: 'en-AU-WilliamNeural' },
  'en-US': { f: 'en-US-JennyNeural', m: 'en-US-GuyNeural', f2: 'en-US-AriaNeural', m2: 'en-US-ChristopherNeural' },
};
const escXml = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

async function azure(text, voice, lang, pct) {
  const key = process.env.AZURE_SPEECH_KEY, region = process.env.AZURE_SPEECH_REGION;
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}"><voice name="${voice}"><prosody rate="${pct >= 0 ? '+' : ''}${pct}%">${escXml(text)}</prosody></voice></speak>`;
  const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'catalis' },
    body: ssml,
  });
  if (!r.ok) throw new Error('azure ' + r.status);
  return Buffer.from(await r.arrayBuffer());
}

// Groq Orpheus (natural English, American voices), uses the GROQ_API_KEY the AI tutor already has.
// Long text is split into sentences of <= 190 characters, synthesised in parallel and joined as one WAV.
const GROQ_VOICES = { f: 'hannah', f2: 'diana', m: 'troy', m2: 'daniel' };
function chunks(text) {
  const parts = String(text).replace(/\s+/g, ' ').match(/[^.!?]+[.!?]*["')]*\s*/g) || [text];
  const out = []; let cur = '';
  for (let p of parts) {
    while (p.length > 190) { const cut = p.lastIndexOf(' ', 190) > 60 ? p.lastIndexOf(' ', 190) : 190; out.push(p.slice(0, cut)); p = p.slice(cut); }
    if ((cur + p).length > 190) { if (cur.trim()) out.push(cur); cur = p; } else cur += p;
  }
  if (cur.trim()) out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}
function pcmOf(buf) { // returns {fmt, data} from a RIFF/WAVE buffer
  let i = 12, fmt = null, data = null;
  while (i + 8 <= buf.length) {
    const id = buf.toString('ascii', i, i + 4); let size = buf.readUInt32LE(i + 4);
    if (id === 'data' && (size === 0 || size === 0xffffffff || i + 8 + size > buf.length)) size = buf.length - i - 8;
    if (id === 'fmt ') fmt = buf.slice(i + 8, i + 8 + size);
    if (id === 'data') { data = buf.slice(i + 8, i + 8 + size); break; }
    i += 8 + size + (size % 2);
  }
  return { fmt, data };
}
function wavJoin(bufs) {
  const ps = bufs.map(pcmOf); const fmt = ps[0].fmt; const data = Buffer.concat(ps.map((p) => p.data || Buffer.alloc(0)));
  const h = Buffer.alloc(12 + 8 + fmt.length + 8);
  h.write('RIFF', 0); h.writeUInt32LE(h.length - 8 + data.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(fmt.length, 16); fmt.copy(h, 20);
  h.write('data', 20 + fmt.length); h.writeUInt32LE(data.length, 24 + fmt.length);
  return Buffer.concat([h, data]);
}
async function groq(text, g) {
  const voice = GROQ_VOICES[g] || GROQ_VOICES.f;
  const one = async (input) => {
    const r = await fetch('https://api.groq.com/openai/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.GROQ_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.GROQ_TTS_MODEL || 'canopylabs/orpheus-v1-english', voice, input, response_format: 'wav' }),
    });
    if (!r.ok) throw new Error('groq ' + r.status + ' ' + (await r.text().catch(() => '')).slice(0, 300));
    return Buffer.from(await r.arrayBuffer());
  };
  const bufs = await Promise.all(chunks(text).map(one));
  return bufs.length === 1 ? bufs[0] : wavJoin(bufs);
}

module.exports = async (req, res) => {
  if (req.method === 'GET' && req.query && req.query.probe) { // health check without secrets: synthesises one short fixed phrase
    const t0 = Date.now();
    try { const b = await groq('Hello there.', 'f'); return res.status(200).json({ ok: true, bytes: b.length, ms: Date.now() - t0 }); }
    catch (e) { return res.status(200).json({ ok: false, err: String(e.message).slice(0, 300), ms: Date.now() - t0 }); }
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!(await checkKey(req))) return res.status(401).json({ error: 'auth' });
  const body = req.body || {};
  const text = String(body.text || '').slice(0, 1500);
  if (!text.trim()) return res.status(400).json({ error: 'bad_request' });
  const lang = VOICES[body.lang] ? body.lang : 'en-GB';
  const voice = VOICES[lang][body.voice] || VOICES[lang].f;
  const rate = Math.max(0.5, Math.min(1.3, Number(body.rate) || 1));
  const pct = Math.round((rate - 1) * 100);
  try {
    let buf;
    if (process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION) {
      try { buf = await azure(text, voice, lang, pct); } catch (e) { console.error(e.message); }
    }
    let type = 'audio/mpeg';
    if (!buf) { buf = await groq(text, body.voice); type = 'audio/wav'; }
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'private, max-age=604800');
    return res.status(200).send(buf);
  } catch (e) {
    console.error('tts', e && e.message);
    return res.status(502).json({ error: 'upstream' });
  }
};
