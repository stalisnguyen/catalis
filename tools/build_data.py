"""Build the app data files in data/ from the checked content in content/out.
Run: python3 tools/build_data.py
"""
import re, json, glob, collections
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
for f in ('topic_a.json', 'topic_b.json', 'topic_c.json', 'topic_d.json', 'topic_e.json', 'topic_f.json', 'topic_g.json', 'topic_h.json'):
    for w in load(f):
        if w['w'].lower() in seen: continue
        seen.add(w['w'].lower())
        by[w.get('lv', 4)].append([w['w'], w['ipa'], w['pos'], w['vi'], w['ex'], w['exvi'], w['col'], w['fam'], w['em'], w['topic']])
# phrase decks (content/out/phr/t*.json, spec content/PHRASE_SPEC.md): 6 collocation, 7 idiom, 8 phrasal verb
PHR_TOPIC = ['Thinking and learning', 'Change and technology', 'Time and work', 'Movement and transport', 'Communication and the media',
             'Chance and nature', 'Quantity and money', 'Materials and the built environment', 'Reactions and health',
             'Power and social issues', 'Quality and the arts', 'Relationships and people', 'Preference and leisure']
PHR_LV = {'col': 6, 'idiom': 7, 'pv': 8}
CEFR = {'B2': 0, 'C1': 1, 'C2': 2}
phr = []
for f in sorted(glob.glob(str(out / 'phr' / 't[0-9]*.json'))):
    t = PHR_TOPIC[int(re.search(r't(\d+)', f).group(1)) - 1]
    for x in json.load(open(f, encoding='utf-8')):
        k = x['w'].lower()
        if k in seen: continue
        seen.add(k)
        phr.append((PHR_LV[x['deck']], CEFR[x['cefr']], x, t))
phr.sort(key=lambda r: (r[0], r[1]))
for lv, _, x, t in phr:
    by[lv].append([x['w'], '', x['pat'] + ', ' + x['cefr'], x['vi'], x['ex'], x['exvi'], x['alt'], x['use'], x.get('em', ''), t])
for lv, rows in by.items():
    dump(f'vocab-{lv}.json', rows)
    print('vocab', lv, len(rows))

reading = [p for f in sorted(glob.glob(str(out / 'read_*.json'))) for p in json.load(open(f, encoding='utf-8'))]
dump('reading.json', reading)
listening = [p for f in sorted(glob.glob(str(out / 'listen_*.json'))) for p in json.load(open(f, encoding='utf-8'))]
dump('listening.json', listening)
# band 9 models are merged into the existing prompts: model9, why9, band8vs9
w9 = {x['id']: x for f in ('write9_t1.json', 'write9_t2.json') for x in load(f)}
def add9(lst):
    for x in lst:
        if x['id'] in w9:
            x.update({k: w9[x['id']][k] for k in ('model9', 'why9', 'band8vs9')})
    return lst
writing = {'t1a': add9(load('write_1a.json')), 't1g': add9(load('write_1g.json')), 't2': add9(load('write_2a.json') + load('write_2b.json'))}
assert all('model9' in x for k in writing for x in writing[k]), 'missing band 9 model'
dump('writing.json', writing)
sa, sb = load('speak_a.json'), load('speak_b.json')
speaking = {'p1': sa['p1'] + sb.get('p1', []), 'p2': sa['p2'] + sb['p2']}
s9 = [load('speak9_a.json'), load('speak9_b.json')]
p1_9 = {t['topic']: t['samples9'] for d in s9 for t in d.get('p1', [])}
p2_9 = {c['id']: c for d in s9 for c in d.get('p2', [])}
for t in speaking['p1']:
    if t['topic'] in p1_9: t['samples9'] = p1_9[t['topic']]
for c in speaking['p2']:
    if c['id'] in p2_9: c.update({k: p2_9[c['id']][k] for k in ('sample9', 'why9', 'p3samples9')})
assert all('sample9' in c for c in speaking['p2']) and all('samples9' in t for t in speaking['p1'])
dump('speaking.json', speaking)
dump('grammar.json', load('gram_a.json') + load('gram_b.json') + load('gram_c.json'))
dump('pron.json', load('pron.json'))
dump('daily.json', load('daily.json'))
print('reading', len(reading), 'listening', len(listening))
