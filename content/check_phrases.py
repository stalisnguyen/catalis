import json, sys, re
path = sys.argv[1]; want = dict(zip(['col', 'idiom', 'pv'], map(int, sys.argv[2:5])))
ex_set = set(open('/home/claude/catalis/content/existing_phrases.txt', encoding='utf-8').read().split('\n'))
out = json.load(open(path, encoding='utf-8'))
err = []; seen = set(); cnt = {'col': 0, 'idiom': 0, 'pv': 0}
PAT = {'v + n', 'adj + n', 'adv + adj', 'adv + v', 'n + n', 'n + of + n', 'v + prep', 'adj + prep', 'v + adv', 'phrase'}
SLOT = re.compile(r"\b(sb|sth|one's|someone|something|your|you)\b")
def key(w): return re.sub(r'\s+', ' ', SLOT.sub('', w.lower())).strip()
for i, b in enumerate(out):
    w = str(b.get('w', '')).strip(); tag = w or f'#{i}'
    for k in ['w', 'deck', 'pat', 'cefr', 'vi', 'use', 'ex', 'exvi']:
        if not str(b.get(k, '')).strip(): err.append(f'{tag}: empty {k}')
    if 'em' not in b: err.append(f'{tag}: missing em')
    d = b.get('deck')
    if d not in cnt: err.append(f'{tag}: bad deck {d}'); continue
    cnt[d] += 1
    p = str(b.get('pat', ''))
    if d == 'col' and p not in PAT: err.append(f'{tag}: bad pat {p}')
    if d == 'idiom' and p != 'idiom': err.append(f'{tag}: pat must be idiom')
    if d == 'pv' and not p.startswith('phrasal verb'): err.append(f'{tag}: pat must start with phrasal verb')
    if b.get('cefr') not in ('B2', 'C1', 'C2'): err.append(f'{tag}: cefr must be B2/C1/C2')
    if not isinstance(b.get('alt'), list) or not 2 <= len(b['alt']) <= 3: err.append(f'{tag}: alt needs 2-3 items')
    k = key(w)
    if k in seen: err.append(f'{tag}: duplicate')
    seen.add(k)
    if w.lower() in ex_set or k in ex_set: err.append(f'{tag}: already in the app')
    ex = str(b.get('ex', '')).lower(); n = len(ex.split())
    if not 9 <= n <= 24: err.append(f'{tag}: example has {n} words, want 10-22')
    words = [x for x in re.findall(r"[a-z']+", k) if len(x) > 3 and x not in ('with', 'from', 'into', 'over', 'that', 'than', 'about')]
    if words and not any(x[:max(3, len(x) - 3)] in ex for x in words): err.append(f'{tag}: example may not use the phrase')
    for f in ['vi', 'use', 'exvi', 'w', 'ex']:
        s = str(b.get(f, ''))
        if '—' in s or '·' in s or re.search('[←-⇿]', s): err.append(f'{tag}: dash/arrow/dot in {f}')
for d, n in want.items():
    if cnt[d] != n: err.append(f'deck {d}: {cnt[d]} items, want {n}')
print('OK' if not err else '\n'.join(err[:60] + ([f'... {len(err)} problems'] if len(err) > 60 else [])))
