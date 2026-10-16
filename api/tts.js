// Natural English speech, locked by APP_PASSWORD.
// Uses Azure Speech when AZURE_SPEECH_KEY + AZURE_SPEECH_REGION are set, otherwise the free
// Microsoft Edge read-aloud neural voices (no key). Responses are cacheable, so each line is
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

async function edge(text, voice, pct) {
  const { EdgeTTS } = require('edge-tts-universal');
  const tts = new EdgeTTS(text, voice, { rate: `${pct >= 0 ? '+' : ''}${pct}%` });
  const out = await tts.synthesize();
  return Buffer.from(await out.audio.arrayBuffer());
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!checkKey(req)) return res.status(401).json({ error: 'auth' });
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
    if (!buf) buf = await edge(text, voice, pct);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'private, max-age=604800');
    return res.status(200).send(buf);
  } catch (e) {
    console.error('tts', e && e.message);
    return res.status(502).json({ error: 'upstream' });
  }
};
