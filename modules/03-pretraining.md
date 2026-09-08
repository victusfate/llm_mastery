# Module 3: data curation, aggregation, and pretraining

Full route: Weeks 7–10, 208 hours. Bootcamp: Weeks 3–5, 156 hours. Dependency: Module 2.

## Outcome

An auditable data pipeline and a controlled pretraining study, with the full path from source documents to model metrics inspectable. This is the core data-curation block.

## Concepts to explain

Data quality is task-dependent. Filtering changes topic, language, length, and difficulty distributions; fewer duplicates can change both effective data diversity and compute use. Comparing only final loss without controlling token budget is ambiguous.

Learn source discovery, metadata and provenance, schema normalization, streaming reads, sharding, deterministic sampling, malformed-document handling, exact and near deduplication, quality scoring, privacy filtering, mixture weighting, packing, and contamination controls. Study [DataTrove](https://github.com/huggingface/datatrove) pipeline components and [TinyStories](https://arxiv.org/abs/2305.07759) as a small-scale modeling reference.

## Labs

1. Aggregate two distinguishable sources: a reviewed text subset and a generated structured-text corpus. Record revision, retrieval instructions, rights/terms to review, source IDs, hashes, token counts, and schema. Begin with 10,000 documents; scale only after tests. If third-party data is unavailable, use two generated distributions and label the limitation.
2. Build a streaming normalizer that preserves provenance, rejects corrupt records explicitly, handles interrupted writes, and resumes without silently duplicating records. Track input, kept, rejected, duplicate, and failed counts so they reconcile.
3. Define normalization for exact hashes. Create planted exact/near duplicates and use token shingles with Jaccard or MinHash-style candidate detection. Explain false positives/negatives. Form duplicate groups before assigning new train/validation/test splits; for fixed benchmark splits, quarantine overlaps and preserve an untouched evaluation policy.
4. Add two inspectable filters, such as repetition and length, with logged rejection reasons. Manually inspect a stratified sample of at least 100 kept/rejected examples. Avoid assuming non-English or unusual formatting means low quality.
5. Train baseline and curated variants with the same architecture, tokenizer, optimizer policy, effective batch, and token budget. Account for repeated epochs when filtered data shrinks. Evaluate loss by source and on an untouched mixture; compare at least three seeds for a small configuration.
6. Interrupt and resume training, including data position and random states. Log loss, gradient norm, learning rate, valid tokens, throughput, memory, and checkpoint metadata. Write an incident report for one deliberately injected failure.

Produce [Project A](../projects/README.md). The [TinyStories dataset card](https://huggingface.co/datasets/roneneldan/TinyStories) is one candidate to inspect; pin a revision and follow its terms. Do not download a web-scale corpus for this course.

## Gate

Audit an unfamiliar shard, detect planted leakage, explain the curation comparison’s confounds, and reproduce a resumed run within a stated numerical tolerance. A filter that worsens generalization is a valid result if measured correctly.

Stretch: learned quality ranking, mixture reweighting, temporal splits, or continued pretraining with a forgetting evaluation. Directly useful upstream work can replace a local pipeline component when it meets the same gate.

## Dedicated lab pages

- [Lab 03-01: Aggregate sources with a provenance manifest](../site/lab.html?lab=03-01) · [Markdown guide](../docs/labs/03-01.md)
- [Lab 03-02: Streaming normalization and restart safety](../site/lab.html?lab=03-02) · [Markdown guide](../docs/labs/03-02.md)
- [Lab 03-03: Exact and near-duplicate auditing](../site/lab.html?lab=03-03) · [Markdown guide](../docs/labs/03-03.md)
- [Lab 03-04: Inspectable quality filters](../site/lab.html?lab=03-04) · [Markdown guide](../docs/labs/03-04.md)
- [Lab 03-05: Matched-budget pretraining comparison](../site/lab.html?lab=03-05) · [Markdown guide](../docs/labs/03-05.md)
- [Lab 03-06: Checkpoint recovery and training observability](../site/lab.html?lab=03-06) · [Markdown guide](../docs/labs/03-06.md)
