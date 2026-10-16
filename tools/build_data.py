"""Build the app data files in data/ from the checked content in content/out.
Run: python3 tools/build_data.py
"""
import json, glob, collections
from pathlib import Path

root = Path(__file__).resolve().parent.parent
out = root / 'content' / 'out'
data = root / 'data'
data.mkdir(exist_ok=True)
load = lambda n: json.load(open(out / n, encoding='utf-8'))
def dump(name, obj):
    (data / name).write_text(json.dumps(obj, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

# vocabulary: compact rows [w, ipa, pos, vi, ex, exvi, col, fam, em, topic]
base = json.load(open(root / 'content' / 'words_base.json', encoding='utf-8'))
words = [w for f in sorted(glob.glob(str(out / 'v[0-9]*.json'))) for w in json.load(open(f, encoding='utf-8'))]
assert len(words) == len(base)
by = collections.defaultdict(list)
seen = set()
for w, b in zip(words, base):
    assert w['w'] == b['w']
    if w['w'].lower() in seen: continue
    seen.add(w['w'].lower())
    by[b['lv']].append([w['w'], w['ipa'], w['pos'], w['vi'], w['ex'], w['exvi'], w['col'], w['fam'], w['em'], ''])
for f in ('topic_a.json', 'topic_b.json'):
    for w in load(f):
        if w['w'].lower() in seen: continue
        seen.add(w['w'].lower())
        by[4].append([w['w'], w['ipa'], w['pos'], w['vi'], w['ex'], w['exvi'], w['col'], w['fam'], w['em'], w['topic']])
for lv, rows in by.items():
    dump(f'vocab-{lv}.json', rows)
    print('vocab', lv, len(rows))

reading = [p for f in sorted(glob.glob(str(out / 'read_*.json'))) for p in json.load(open(f, encoding='utf-8'))]
dump('reading.json', reading)
listening = [p for f in sorted(glob.glob(str(out / 'listen_*.json'))) for p in json.load(open(f, encoding='utf-8'))]
dump('listening.json', listening)
dump('writing.json', {'t1a': load('write_1a.json'), 't1g': load('write_1g.json'), 't2': load('write_2a.json') + load('write_2b.json')})
sa, sb = load('speak_a.json'), load('speak_b.json')
dump('speaking.json', {'p1': sa['p1'] + sb.get('p1', []), 'p2': sa['p2'] + sb['p2']})
dump('grammar.json', load('gram_a.json') + load('gram_b.json'))
dump('pron.json', load('pron.json'))
dump('daily.json', load('daily.json'))
print('reading', len(reading), 'listening', len(listening))
