"""List every fixed English text the app can read aloud, for pre-generated audio.
Writes audio_texts.json: [{"h": hash, "t": text, "v": kokoro voice}] (unique by hash).
The hash must match the app: sha1 of the trimmed text, first 12 hex chars (see textHash in src/app.js)."""
import json, glob, hashlib, sys
def L(n): return json.load(open('data/' + n + '.json', encoding='utf-8'))
F, M, F2 = 'bf_emma', 'bm_george', 'bf_isabella'
items = []
def add(t, v=F):
    t = (t or '').strip()
    if t: items.append((t, v))
voc = [r for f in sorted(glob.glob('data/vocab-*.json')) for r in json.load(open(f, encoding='utf-8'))]
for r in voc: add(r[0]); add(r[4])
if '--colloc' in sys.argv:
    for r in voc:
        for x in r[6]: add(x)
for x in L('grammar'):
    for e in x['ex']: add(e[0])
pr = L('pron')
for s in pr['sounds']:
    for w in s['ex']: add(w)
    for p in s['pairs']: [add(w) for w in p]
for m in pr['minimal']:
    for p in m['pairs']: [add(w) for w in p]
for r in pr['rules']:
    for e in r['examples']: add(e[0])
for x in L('daily'): add(x['en']); add(x['ex'][0])
sp = L('speaking')
for t in sp['p1']:
    for q in t['qs']: add(q, M)
    for q, a in t['samples'] + t.get('samples9', []): add(a, F2)
for c in sp['p2']:
    add(c['card'], M)
    for q in c['p3']: add(q, M)
    add(c['sample'], F2); add(c.get('sample9'), F2)
    for q, a in c['p3samples'] + c.get('p3samples9', []): add(a, F2)
    for e in c['vocab']: add(e[0])
w = L('writing')
for k in w:
    for x in w[k]: add(x['model'], F2); add(x.get('model9'), F2)
for p in L('reading'):
    for v in p['vocab']: add(v[0])
out = {}
for t, v in items:
    h = hashlib.sha1(t.encode('utf-8')).hexdigest()[:12]
    out.setdefault(h, {'h': h, 't': t, 'v': v})
json.dump(list(out.values()), open('audio_texts.json', 'w', encoding='utf-8'), ensure_ascii=False)
print(len(out), 'texts', sum(len(x['t']) for x in out.values()), 'chars')
