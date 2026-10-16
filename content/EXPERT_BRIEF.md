# Expert pack (band 8.5-9) - shared brief

Catalis already has content for band 4.5-8 (see content/out/). The owner uses English daily at a professional level and needs material for band 8.5-9. You add ONE file in /home/claude/catalis/content/out/ as told in your task.

Read first: /home/claude/catalis/content/CONTENT_SPEC.md (schemas and shared rules). Look at one or two existing files of the same kind in content/out/ to match the exact shape. Do not touch any other file.

What "band 8.5-9" means here
- Reading: passages like the hardest Cambridge Academic passage 3: 900-1050 words, abstract and argumentative (philosophy of science, linguistics, economics, cognitive science, history of ideas, ecology theory), long sentences, nominalisation, hedging, concessive structures, the writer's stance only implied. Questions test fine distinctions: paraphrase with no word overlap, NOT GIVEN vs FALSE traps where the passage discusses something close, distractors that use words from the text but distort the claim, headings that differ by one nuance, completion answers that require the exact word form. Every answer must still be defensible from the text, and "why" must quote the decisive evidence and explain the trap in Vietnamese.
- Listening: natural fast speech (written for TTS, so convey it with contractions, false starts, self-corrections, hedges, interruptions "sorry, go on", fillers "you know", "I mean"), several distractors per answer (a number is mentioned then corrected, an option is considered then rejected, the answer is a paraphrase of the option), part 3 with three speakers who disagree, part 4 a dense lecture with academic vocabulary. Mix en-GB, en-AU, en-US.
- Writing / Speaking models: genuinely band 9: fully natural, precise lexical choice, collocation and idiom used naturally, wide grammatical range used for meaning (not showing off), flawless cohesion without mechanical linkers, a clear and nuanced position. No memorised phrases ("In this day and age", "It is undeniable that"). Analysis in Vietnamese explains concretely why it is 9 and not 8.
- Vocabulary: C2 items a professional user would still find useful for band 9 (precise verbs, academic collocations, natural idioms and phrasal verbs, hedging and stance language), not rare literary words nobody uses.

Rules
- Original content only. Never copy passages, questions or model answers from Cambridge, IDP, British Council, ielts.org or any book or website. Mimic format and difficulty only. Facts in passages should be plausible and not misleading; when unsure, frame claims as positions held by named (fictional) researchers or as general views rather than inventing precise statistics about real institutions.
- English: British spelling. Vietnamese: natural, plain, everyday. Never use the em dash character or unicode arrows anywhere (write "->" if needed).
- Build the file with a Python script if convenient (you can write it in chunks), valid UTF-8 JSON.
- Validate: `cd /home/claude/catalis/content && python3 check_content.py <kind> out/<yourfile>.json` until it prints OK. Then re-read a sample of your own items critically as a strict IELTS examiner: is every answer unambiguous? is every band 9 text really band 9? Fix and re-validate.
- Reply when done with only: file name, counts, and anything you were unsure about (max 6 lines).
