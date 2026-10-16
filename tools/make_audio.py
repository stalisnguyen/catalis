"""Pre-generate Listening audio with Kokoro (open-source TTS, Apache 2.0), one mp3 per script line.
Usage: python3 tools/make_audio.py <test numbers comma separated> <out dir>
Writes <out>/audio/l/<part id>/<line index 3 digits>.mp3 and <out>/audio/l/<part id>/v.json (voice used per speaker)."""
import json, sys, os, subprocess, hashlib
import numpy as np, soundfile as sf
from kokoro import KPipeline

tests = {int(x) for x in sys.argv[1].split(',')}
out = sys.argv[2]
data = json.load(open('data/listening.json', encoding='utf-8'))
# British voices for en-GB and en-AU speakers (Kokoro has no Australian voices), American for en-US.
VOICES = {
    'b': {'f': ['bf_emma', 'bf_isabella', 'bf_alice', 'bf_lily'], 'm': ['bm_george', 'bm_lewis', 'bm_fable', 'bm_daniel']},
    'a': {'f': ['af_heart', 'af_bella', 'af_nicole', 'af_sarah'], 'm': ['am_michael', 'am_fenrir', 'am_puck', 'am_adam']},
}
pipes = {}
def pipe(code):
    if code not in pipes: pipes[code] = KPipeline(lang_code=code)
    return pipes[code]

for p in data:
    if p['test'] not in tests: continue
    d = os.path.join(out, 'audio', 'l', p['id']); os.makedirs(d, exist_ok=True)
    used = {'b': {'f': 0, 'm': 0}, 'a': {'f': 0, 'm': 0}}
    spk = {}
    for s in p['speakers']:
        code = 'a' if s['accent'] == 'en-US' else 'b'
        g = 'm' if s['voice'] == 'm' else 'f'
        spk[s['id']] = (code, VOICES[code][g][used[code][g] % 4]); used[code][g] += 1
    for i, (sid, text) in enumerate(p['lines']):
        code, voice = spk.get(sid, ('b', 'bf_emma'))
        chunks = [a for _, _, a in pipe(code)(text, voice=voice, speed=1.0)]
        audio = np.concatenate([np.asarray(c, dtype=np.float32) for c in chunks]) if chunks else np.zeros(2400, dtype=np.float32)
        wav = os.path.join(d, f'{i:03d}.wav'); mp3 = os.path.join(d, f'{i:03d}.mp3')
        sf.write(wav, audio, 24000)
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-ac', '1', '-b:a', '48k', mp3], check=True)
        os.remove(wav)
    json.dump({'speakers': {k: v[1] for k, v in spk.items()}, 'n': len(p['lines']),
               'h': hashlib.sha1(json.dumps(p['lines']).encode()).hexdigest()[:10]}, open(os.path.join(d, 'v.json'), 'w'))
    print('done', p['id'], len(p['lines']), flush=True)
