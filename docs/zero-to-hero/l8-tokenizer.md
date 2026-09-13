# Lecture 8 · Byte-pair encoding and the tokenizer as a separate model

**Watch:** [Let's build the GPT Tokenizer](https://www.youtube.com/watch?v=zduSFxRajkE) (Andrej Karpathy)
**Reference code:** [minbpe](https://github.com/karpathy/minbpe), MIT licensed
**Background paper:** [Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) (Sennrich et al., 2015)
**Panel:** [train a byte-pair tokenizer on your own text](../../site/zero-to-hero.html?lecture=l8)
**Assessed in:** [lab 02-01](../labs/02-01.md)

## The mechanism in plain terms

A tokenizer is a separate model, trained on its own data, with its own objective, frozen before the language model is trained. Its job is to map strings to integer sequences and back, losslessly. Get it wrong and every downstream number — context length, token budget, cost per document — is wrong with it.

Character-level vocabularies are simple but produce long sequences, and attention cost grows with length. Word-level vocabularies are short but cannot represent anything unseen. Subword encoding takes the middle: frequent sequences become single tokens, rare ones decompose into pieces, and nothing is ever out of vocabulary.

**Byte-pair encoding** is the algorithm, and it is short:

1. Encode the text as UTF-8 bytes. The base vocabulary is the 256 byte values, so any input at all is representable.
2. Count every adjacent pair of tokens in the training text.
3. Merge the most frequent pair into a new token with a fresh id, and record the merge.
4. Repeat until you have the vocabulary size you want.

Encoding new text replays the recorded merges **in learning order**. Decoding expands ids back to bytes and decodes the UTF-8. Two properties follow and both need testing: the vocabulary is an ordered list of merges, not a set, and decode-then-encode is only a round trip if you handle invalid byte sequences deliberately.

Consequences that explain a great deal of language-model behaviour:

- **Whitespace attaches to words.** Because a leading space is a frequent neighbour, ` the` typically becomes one token distinct from `the`. A prompt ending in a space is therefore a different prompt, and trailing-space bugs are real bugs.
- **Digits split by frequency, not by place value.** `1234` may become two tokens and `1235` three, which is one reason arithmetic is harder for these models than its difficulty suggests.
- **Non-English text costs more tokens per character,** because merges were learned from a corpus that mostly did not contain it. That is a fairness and cost issue, not only a technical one.
- **Case and indentation are separate tokens,** so a vocabulary trained without code handles code badly. Deliberately including indentation patterns is why code models tokenise whitespace runs efficiently.
- **The vocabulary is a budget line.** Vocabulary size multiplies the embedding and output projection; shrinking sequences by 10% while doubling the vocabulary is a trade, not a win.

```run
const model = z2h.trainBPE(data.TOKENIZER_SAMPLE, 32);
print("vocabulary", model.vocabularySize,
      "| compression", model.compression.toFixed(2) + "x");
const probes = ["tokenizer", " tokenizer", "TOKENIZER", "1234", "café", "  indented"];
for (const probe of probes) {
  const ids = z2h.encodeBPE(model, probe);
  print(JSON.stringify(probe).padEnd(14), String(ids.length).padStart(2), "tokens",
        JSON.stringify(z2h.tokenPieces(model, ids)),
        z2h.decodeBPE(model, ids) === probe ? "" : "ROUND TRIP BROKEN");
}
```


Real tokenizers add two refinements worth knowing. A **regex pre-split** prevents merges from crossing category boundaries (letters with punctuation, words with numbers) so tokens stay linguistically sensible. **Special tokens** for document boundaries and chat roles are added outside the merge process, and must be impossible to produce from user text — otherwise input can impersonate a role marker, which is a security problem, not a style preference.

## Before you watch: predict in writing

1. You train 256 merges on English prose. How many tokens will the strings `hello`, ` hello`, and `Hello` become, and why might all three differ?
2. Your text never contains the character `ω`. What does your encoder produce for it, and how many tokens?
3. Compression ratio measured on the training text versus a held-out text: which is higher, and by roughly how much?
4. You double the vocabulary from 32k to 64k. Sequence length falls; what grows, and by how much for a model of width 768?

## Watch plan

| Segment | What to extract |
| --- | --- |
| Why tokenisation causes odd behaviours | The specific examples, so you can recognise them in your own outputs |
| Unicode, code points, and UTF-8 | Why byte-level is the sane base, and what a code point is not |
| The merge loop | The exact algorithm: count pairs, merge the best, record it, repeat |
| Encoding and decoding | Replay merges in order; expand recursively; handle undecodable bytes |
| Regex pre-splitting | What crossing a category boundary would cost |
| Special tokens | Where they live and why they cannot be produced by user text |
| Consequences for the model | Digits, whitespace, non-English text, and code |

## Implement it yourself

**Core (roughly 100 lines)**
- `train(text, vocab_size)`: byte encoding, pair counts, iterative merging, recorded merge list
- `encode(text)`: bytes, then merges applied in learning order
- `decode(ids)`: recursive expansion to bytes, then UTF-8 decoding with an explicit error policy
- `save`/`load` in a plain text format you can read and diff

**Then add**
- a regex pre-split so merges never cross category boundaries; compare token counts before and after
- special tokens with an id range that `encode` can never emit from ordinary text
- statistics: vocabulary size, compression on training and held-out text, tokens per character, the longest token learned

## Checks that must pass

1. **Round trip on the training text.** `decode(encode(text)) == text`, exactly, for the whole training text.
2. **Round trip on adversarial inputs.** Empty string, a single space, a long run of spaces, emoji, right-to-left text, an unpaired surrogate written as bytes, a 10,000-character string. State your policy for undecodable byte sequences and test that it is followed.
3. **Determinism.** Same text and same vocabulary size produce the same merge list. Define and document your tie-breaking rule for pairs with equal counts, because ties are common in small texts.
4. **Vocabulary size honoured.** `len(vocab) == 256 + merges_performed`, and training stops cleanly when no pair repeats.
5. **Compression sanity.** Compression on held-out text is above 1 and below the training-text figure. If held-out compression is higher, your split leaked.
6. **Special-token isolation.** Assert that no input string can encode to a special-token id.
7. **Cross-check.** Encode a few strings with an established tokenizer library and compare the token *counts* on the same vocabulary size. They will not match exactly; understand each difference you find.

## Use the panel

Open the [panel](../../site/zero-to-hero.html?lecture=l8), which trains merges on text you supply:

- Start at 0 merges: the token count equals the byte count. Raise the merges to 32 and watch compression climb while the merge frequencies fall — the classic diminishing return.

```run
for (const merges of [0, 8, 16, 32, 64]) {
  const model = z2h.trainBPE(data.TOKENIZER_SAMPLE, merges);
  print("merges", String(merges).padStart(2),
        "| vocabulary", model.vocabularySize,
        "| compression", model.compression.toFixed(2) + "x");
}
// Paste your own text into the panel above and run this again. The returns
// flatten at a different place for prose, code, and non-English text.
```

- Read the merge table in order. The first merges are the most frequent short pairs; later ones build whole words from earlier merges.
- In the probe field, compare `the tokenizer`, ` tokenizer`, and `TOKENIZER`. The token list shows why capitalisation and a leading space change the input the model receives.
- Try `1234` and `1235`, then `café`, then a line of indented code. Each is a different way to see the vocabulary's inherited habits.
- Paste your own text — a code file, a non-English paragraph — and watch the merges change completely. The tokenizer is a model of its training data, and nothing more.

## Common failures and what they look like

| Symptom | Likely cause |
| --- | --- |
| Round trip fails on emoji or accented text | Operating on Python `str` characters instead of UTF-8 bytes |
| Round trip fails only for some ids | Recursive expansion missing, or merges applied in the wrong order when encoding |
| Different merge list on repeated runs | Unstable tie-breaking over a dictionary iteration order |
| Compression looks excellent | Measured on the training text and reported as general performance |
| Model performs oddly on prompts ending with a space | Correct behaviour, surprising consequence: that is a different token sequence |
| Chat template can be spoofed by user input | Special tokens producible from ordinary text; fix the id range, not the prompt |

## Exercises

1. Train vocabularies of 300, 1,000, and 5,000 on the same text and plot compression against vocabulary size on a held-out split. Identify where returns flatten.
2. Compute the embedding and output-projection parameter cost of each vocabulary at model width 768, and put it beside the sequence-length saving. State which you would choose and why.
3. Train one vocabulary on prose and one on code, then cross-evaluate compression. Report all four numbers.
4. Implement the regex pre-split and report how many tokens it costs on prose and how many it saves on code.
5. Write a "tokenizer surprises" test file: ten strings whose token counts you predict in advance, with your predictions recorded before running. Report your hit rate honestly.
6. Measure tokens per character for the same paragraph translated into three languages using one vocabulary trained on English. Write one paragraph on what that means for cost and access.

## Transfer task

Without the video: write `audit_tokenizer(tokenizer, samples)` that returns, per sample, the token count, tokens per character, the round-trip result, and the longest token used, and flags any sample whose tokens-per-character is more than twice the median. Run it over prose, code, numbers, and a non-English text, and write three sentences on what your vocabulary is bad at. [Lab 02-01](../labs/02-01.md) assesses the reversible tokenizer and this audit.

## Where this goes next

Lecture 9 uses a published tokenizer and a published architecture to reproduce GPT-2 (124M), where your token accounting becomes a cost in hours and dollars. Keep your compression numbers: token budget is the unit everything in [module 3](../../modules/03-pretraining.md) is measured in.
