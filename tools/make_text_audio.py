"""Generate Kokoro audio for one shard of audio_texts.json, skipping files that already exist.
Usage: python tools/make_text_audio.py <shard> <shards> <out dir>  -> <out>/<h[:2]>/<h>.mp3"""
import json, sys, os, io
import numpy as np, lameenc
from kokoro import KPipeline
shard, shards, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
texts = [x for x in json.load(open('audio_texts.json', encoding='utf-8')) if int(x['h'], 16) % shards == shard]
pipe = KPipeline(lang_code='b')
enc_args = dict(bit_rate=40, in_sample_rate=24000, channels=1, quality=5)
done = 0
for x in texts:
    path = os.path.join('audio', 't', x['h'][:2], x['h'] + '.mp3')
    if os.path.exists(path): continue  # already in the repo
    dst = os.path.join(out, x['h'][:2], x['h'] + '.mp3'); os.makedirs(os.path.dirname(dst), exist_ok=True)
    chunks = [a for _, _, a in pipe(x['t'], voice=x['v'], speed=1.0)]
    audio = np.concatenate([np.asarray(c, dtype=np.float32) for c in chunks]) if chunks else np.zeros(2400, dtype=np.float32)
    pcm = (np.clip(audio, -1, 1) * 32767).astype('<i2').tobytes()
    e = lameenc.Encoder(); e.set_bit_rate(40); e.set_in_sample_rate(24000); e.set_channels(1); e.set_quality(5)
    open(dst, 'wb').write(e.encode(pcm) + e.flush())
    done += 1
    if done % 200 == 0: print('shard', shard, done, flush=True)
print('shard', shard, 'generated', done, 'of', len(texts), flush=True)
