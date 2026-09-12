# Licensing and attribution for the Zero to Hero track

This track links to material published by someone else. This page records what we checked, what we may reuse, and the rules we follow. **License status checked September 12, 2026** by reading each repository's license file directly; re-check before reusing anything, because repositories add, change, and remove licenses.

## What is ours

Everything written for this track — the lecture guides in this directory, the [track overview](../18-zero-to-hero.md), the interactive panels, the numerical routines behind them (`src/site/z2h-numerics.ts`, `z2h-visuals.ts`, `z2h-widgets.ts`, `z2h-track.ts`, `z2h-worker.ts`, `z2h-data.ts`), the sample datasets, and the exercises — is original work by this repository's contributors, released under this repository's [MIT license](../../LICENSE.md). You may use, adapt, and redistribute it, including commercially, provided the license notice travels with it.

Our implementations were written from the published descriptions of the mechanisms and from the primary papers cited in each guide. They are not translations or ports of the lecture notebooks, and they do not share their structure, variable names, or datasets.

## What is not ours

| Work | Author | Status as checked | What we do |
| --- | --- | --- | --- |
| The nine lecture videos | Andrej Karpathy | Published on YouTube under its standard terms; no separate reuse license granted | Link only. We never host, mirror, transcribe, subtitle, or quote the videos, and we do not embed them until you choose to open one |
| [nn-zero-to-hero](https://github.com/karpathy/nn-zero-to-hero) (lecture notebooks) | Andrej Karpathy | MIT license file present (2022) | Link. Reuse of its code would be permitted with the notice retained; we do not reuse any |
| [micrograd](https://github.com/karpathy/micrograd) | Andrej Karpathy | MIT license file present (2020) | Link for reading |
| [makemore](https://github.com/karpathy/makemore) | Andrej Karpathy | MIT license file present (2022) | Link for reading |
| [minbpe](https://github.com/karpathy/minbpe) | Andrej Karpathy | MIT license file present (2024) | Link for reading |
| [nanoGPT](https://github.com/karpathy/nanoGPT) | Andrej Karpathy | MIT license file present (2022) | Link for reading; the recommended reference if you want reusable code |
| [build-nanogpt](https://github.com/karpathy/build-nanogpt) | Andrej Karpathy | **No license file found** at `master` or `main` | Link for reading only. Without a license, default copyright applies: read it, learn from it, do not copy it into your repository |
| Hosted exercise notebooks linked from the lecture repositories | Andrej Karpathy | Linked from the upstream repository; no separate license stated | Link only |
| Papers (Attention Is All You Need, Batch Normalization, WaveNet, scaling laws, and others) | Respective authors and publishers | Each retains its own terms; several are open-access preprints | Link and cite. We summarise findings in our own words and do not reproduce figures or text |

## Rules we follow in this track

1. **Link, never copy.** No transcripts, no subtitle files, no screenshots of the videos, no pasted notebook cells. If a mechanism needs showing, we implement it ourselves.
2. **Attribute clearly.** The series and its author are named on every page of the track, and the track page states plainly which parts are ours and which are linked.
3. **Check the license before reuse, and record the date.** A repository that is MIT today may not have been yesterday, and an absent license file is not an invitation. Our notes carry the date we checked.
4. **Keep the MIT notice when reusing MIT code.** If you copy code from an MIT-licensed repository into your own work, the copyright notice and license text must travel with it. That applies to the lecture repositories exactly as it applies to ours.
5. **Do not relicense someone else's work.** Our MIT license covers our files only. Linked material is not sublicensed by us and never becomes ours by being referenced.
6. **Say what is unlicensed.** Where no license exists, as with `build-nanogpt` at the time of checking, we say so and tell you not to copy it, rather than quietly assuming permission.

## If you are building on this course

Your own repository will contain your implementations, and if you followed our specifications rather than transcribing a video, that code is yours to license as you wish. Two habits keep this clean:

- Keep a `SOURCES.md` in your project that lists what you read, watched, or copied, with dates and licenses. It takes minutes and settles later questions about provenance.
- If you do copy licensed code, put it in a clearly separated directory with its upstream license file intact, and say so in your README.

This page is our record of diligence, not legal advice. If you intend to redistribute or commercialise something built on third-party material, read the licenses yourself and get advice appropriate to your jurisdiction.
