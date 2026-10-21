# Catalis phrase decks spec - collocations, idioms, phrasal verbs (Vietnamese learners, IELTS band 6.5-9)

Scope follows the vocabulary strands of C1-C2 coursebooks such as Destination C1 & C2 (topic vocabulary, phrasal verbs, phrases/patterns/collocations, idioms), English Collocations in Use (Advanced) and English Idioms in Use (Advanced). Use them only as a guide to which areas and levels to cover. Write every explanation and example yourself. Do not copy example sentences, exercises or definitions from any book or website. The phrases themselves are ordinary English and are fine to use.

## Output

One JSON array written to the output path you are given. Each object:

- "w": the phrase in dictionary form. Use "sb" / "sth" for open slots, e.g. "pose a threat to sth", "take sth for granted", "bring about sth". Lowercase except proper nouns. No trailing punctuation.
- "deck": "col" (collocation), "idiom", or "pv" (phrasal verb).
- "pat": the pattern. For "col": one of "v + n", "adj + n", "adv + adj", "adv + v", "n + n", "n + of + n", "v + prep", "adj + prep", "v + adv", "phrase". For "idiom": "idiom". For "pv": "phrasal verb" (add ", tách được" when the object can go in the middle, e.g. "turn the offer down").
- "cefr": "B2", "C1" or "C2".
- "vi": short natural Vietnamese meaning, 1-2 senses separated by "; ".
- "use": one or two Vietnamese sentences on how to use it: register (Writing học thuật, Speaking, thân mật), and a typical mistake Vietnamese learners make if there is a real one (e.g. "Không nói: make a crime"). For idioms, say honestly whether it suits IELTS Speaking only, and that idioms should not be forced into Writing Task 2.
- "alt": array of 2-3 related phrases: common variants, a stronger/weaker version, a synonym or the opposite. Real, frequent English only.
- "ex": one natural example sentence, 10-22 words, on an IELTS-style subject (study, work, technology, environment, health, society, media, travel, money, the arts, family). It must contain the phrase (inflected forms and filled slots are fine, e.g. "posed a serious threat to wildlife").
- "exvi": natural Vietnamese translation of the example.
- "em": one emoji only when it clearly depicts the meaning, else "".

## Rules

- Topic, counts and level mix are given in your task. Prefer phrases that genuinely raise a band 6-7 learner's range; skip very basic ones (e.g. "make friends", "do homework") and dated or rare idioms ("raining cats and dogs", "it's all Greek to me").
- No duplicates inside your file, and nothing from content/existing_phrases.txt (those are already in the app).
- Vietnamese: plain everyday Vietnamese, no em dash, no unicode arrows, no "·".
- Verify with: python3 /home/claude/catalis/content/check_phrases.py <output.json> <col> <idiom> <pv>
  It must print OK. Fix what it reports and re-run.
- Reply only with the item count per deck and any phrases you were unsure about.
