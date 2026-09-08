# Concept field guide

Original explanatory notes for the interactive concept explorer. Select or search any phrase in the workbench; exact matches and aliases open these cards. Related terms let you drill further. Course references and deeper primary readings are linked through each module.

Each entry separates meaning, practical importance, an example, a common mistake, and a retrieval question. Video links point to a related complete lecture rather than an unverified exact timestamp. The numeric examples are small teaching examples, not measured model results.

## Gradient
Aliases: gradients; derivative; derivatives
Module: 01-foundations
Related: Loss; Autograd; Finite differences; Gradient descent

### What it means
The gradient is the vector of partial derivatives of a scalar objective with respect to its parameters. It describes the local first-order change, not a promise about a large step.

### Why it matters
Optimization needs both direction and scale. A wrong sign, batch reduction, or detached computation can make plausible-looking code optimize the wrong function.

### Concrete example
For L(w)=(w−3)², dL/dw=2(w−3). At w=1, the gradient is −4; a descent step w←w−0.1g moves to 1.4.

### Common mistake
A gradient depends on the objective and parameterization. A larger norm does not automatically imply more useful learning.

### Check your understanding
What happens if the loss is changed from a mean to a sum over B examples?

[Full module and primary references](../modules/01-foundations.md)

## Loss
Aliases: losses; objective; objectives
Module: 01-foundations
Related: Cross-entropy; Generalization; Data leakage

### What it means
A loss is the scalar quantity minimized during training. Its definition includes which examples or tokens count, their weights, and how values are reduced.

### Why it matters
The loss is your executable specification of the training task. Good optimization cannot repair an objective that rewards the wrong behavior.

### Concrete example
For a correct-class probability of 0.25, negative log-likelihood is −ln(0.25)≈1.386 nats.

### Common mistake
Lower training loss can reflect memorization or data leakage; evaluate separately on held-out examples.

### Check your understanding
Could two trainers use identical logits and labels but different gradients? Name a reduction difference.

[Full module and primary references](../modules/01-foundations.md)

## Autograd
Aliases: automatic differentiation; backpropagation; backward
Module: 01-foundations
Related: Gradient; Tensor; Finite differences

### What it means
Automatic differentiation composes derivatives of elementary operations using the chain rule. Reverse mode efficiently obtains a scalar loss gradient with respect to many parameters.

### Why it matters
You can express tensor computations normally and let the framework build the derivative calculation, while still verifying that the intended graph exists.

### Concrete example
If y=w*x and L=y², backpropagation sends 2y through the multiplication, giving dL/dw=2y*x.

### Common mistake
Detaching a tensor, converting values to Python numbers, or updating parameters incorrectly can disconnect or corrupt the graph.

### Check your understanding
Why is a finite-difference check still useful when autograd computes derivatives?

[Full module and primary references](../modules/01-foundations.md)

## Finite differences
Aliases: finite-difference; numerical gradient; gradient check
Module: 01-foundations
Related: Gradient; Autograd; Precision

### What it means
A numerical derivative estimates the effect of a small perturbation. The centered estimate is [L(w+h)−L(w−h)]/(2h).

### Why it matters
It independently checks an analytical or autograd derivative on a small, deterministic case.

### Concrete example
For L(w)=w² and w=3, compare the centered estimate to the exact derivative 6 over several h values.

### Common mistake
Very large h introduces approximation error; very small h amplifies floating-point cancellation. Use float64 and avoid nondifferentiable boundaries initially.

### Check your understanding
Why should dropout be disabled during a simple numerical gradient check?

[Full module and primary references](../modules/01-foundations.md)

## Tensor
Aliases: tensors; tensor shapes; shape; shapes
Module: 01-foundations
Related: Attention; Batch size; Precision

### What it means
A tensor is a multidimensional array. In training code, its shape, dtype, device, and axis meanings all belong to the algorithm.

### Why it matters
Broadcasting can produce a valid array with the wrong semantics. Write down each axis instead of relying only on a successful matrix multiply.

### Concrete example
A token embedding batch might have shape B×T×d: batch size, sequence length, hidden width.

### Common mistake
An accidental extra axis can multiply memory or change a loss reduction without raising an exception.

### Check your understanding
What are the axes of an attention-score tensor before the value aggregation?

[Full module and primary references](../modules/01-foundations.md)

## Logit
Aliases: logits
Module: 01-foundations
Related: Softmax; Cross-entropy; Temperature

### What it means
A logit is an unnormalized score used to construct probabilities. In multiclass prediction, softmax converts a vector of logits into a categorical distribution.

### Why it matters
Losses are usually computed directly from logits for numerical stability. They are not already probabilities.

### Concrete example
Logits [2,1,0] become about [0.665,0.245,0.090]. Adding 1,000 to every entry leaves these probabilities unchanged mathematically.

### Common mistake
Applying softmax before a loss that expects logits can change the objective and gradients.

### Check your understanding
Why does a shared constant shift leave softmax probabilities unchanged?

[Full module and primary references](../modules/01-foundations.md)

## Softmax
Aliases: softmax distribution
Module: 01-foundations
Related: Logit; Temperature; Cross-entropy; Entropy

### What it means
Softmax converts scores z into probabilities p_i=exp(z_i)/sum_j exp(z_j). Subtract the maximum score first to avoid unnecessary overflow.

### Why it matters
A language model predicts a distribution over the vocabulary at each supervised position.

### Concrete example
With logits [0,0], both probabilities are 0.5. With [ln(3),0], they are 0.75 and 0.25.

### Common mistake
Softmax normalizes relative scores. It does not ensure calibration or make an incorrect model knowledgeable.

### Check your understanding
If every logit gains the same constant, which numerator and denominator factors cancel?

[Full module and primary references](../modules/01-foundations.md)

## Cross-entropy
Aliases: cross entropy; negative log-likelihood; NLL
Module: 01-foundations
Related: Softmax; Loss; Padding; Perplexity

### What it means
For a one-hot class label, cross-entropy is −ln(p_correct). For a general target distribution q, it is −sum_i q_i ln(p_i).

### Why it matters
It penalizes confident wrong predictions heavily and connects next-token training to maximum likelihood.

### Concrete example
A correct-token probability of 0.5 gives about 0.693 nats. A probability of 0.01 gives about 4.605 nats.

### Common mistake
The mean must be taken over the intended valid examples or tokens. Padding and inconsistent denominators can distort the update.

### Check your understanding
What is the loss for a uniform distribution over V classes?

[Full module and primary references](../modules/01-foundations.md)

## Temperature
Aliases: sampling temperature
Module: 01-foundations
Related: Softmax; Sampling; Evaluation

### What it means
Temperature rescales logits before softmax: p=softmax(z/T), with T>0. Larger T flattens a fixed score distribution; smaller T sharpens it.

### Why it matters
It changes sampling behavior during generation and therefore affects evaluation comparisons and RL rollout data.

### Concrete example
For [2,1,0], raising T moves probabilities toward one third each. As T approaches zero, the maximum-score choice dominates when unique.

### Common mistake
Changing sampling temperature does not update model weights. A benchmark comparison should record it.

### Check your understanding
Can temperature improve apparent task success without any training? How would you measure that fairly?

[Full module and primary references](../modules/01-foundations.md)

## Entropy
Aliases: policy entropy
Module: 07-rl
Related: Policy; Softmax; Reward

### What it means
Entropy measures distributional uncertainty: H(p)=−sum_i p_i ln(p_i). It is zero for a deterministic categorical distribution and largest for a uniform one.

### Why it matters
In RL, tracking entropy helps detect a policy becoming nearly deterministic or losing exploration too early.

### Concrete example
A fair two-action policy has entropy ln(2)≈0.693 nats. A policy choosing one action with probability one has entropy zero.

### Common mistake
High entropy is not always desirable; random actions can be diverse and consistently wrong.

### Check your understanding
Why can an entropy bonus conflict with reward maximization on an easy deterministic task?

[Full module and primary references](../modules/07-rl.md)

## Gradient descent
Aliases: descent; SGD; stochastic gradient descent
Module: 01-foundations
Related: Gradient; Learning rate; Optimizer

### What it means
Gradient descent updates parameters opposite a loss gradient: w_next=w−eta*g. Stochastic variants estimate that gradient from a batch.

### Why it matters
Learning-rate stability depends on curvature and estimator noise, so a good setting for a tiny quadratic is not a recipe for an LLM.

### Concrete example
For L(w)=w²/2, the update is (1−eta)w. It converges for 0<eta<2 and diverges for eta>2.

### Common mistake
A tiny step can be stable but slow; a large step can oscillate or explode even when the gradient is correct.

### Check your understanding
Why does eta=2 oscillate without shrinking on this quadratic?

[Full module and primary references](../modules/01-foundations.md)

## Learning rate
Aliases: learning-rate; step size
Module: 01-foundations
Related: Optimizer; Batch size; Gradient descent

### What it means
The learning rate controls how strongly an optimizer changes parameters from an update direction. A schedule changes it over training.

### Why it matters
Too-large updates can destroy useful representations or produce numerical instability; too-small updates may waste compute.

### Concrete example
In plain SGD, multiplying eta by two doubles the parameter step for the same gradient. Adaptive optimizers also transform that gradient.

### Common mistake
Learning rate interacts with batch size, normalization, initialization, optimizer state, and training duration.

### Check your understanding
Why is comparing optimizers at only one shared learning rate potentially unfair?

[Full module and primary references](../modules/01-foundations.md)

## Optimizer
Aliases: optimizers; AdamW; Adam; momentum
Module: 01-foundations
Related: Checkpoint; Gradient; Learning rate; Weight decay

### What it means
An optimizer maps gradients and internal state to parameter updates. SGD uses gradients directly; momentum and adaptive methods maintain historical statistics.

### Why it matters
Optimizer state affects both training dynamics and memory, and must be restored for a faithful checkpoint resume.

### Concrete example
Adam-style methods maintain moving estimates of first and second gradient moments. AdamW applies weight decay separately from the adaptive gradient transformation.

### Common mistake
Saving only model weights loses optimizer history; resumed training may differ even with the same learning-rate schedule.

### Check your understanding
What state besides model weights belongs in a reproducible training checkpoint?

[Full module and primary references](../modules/01-foundations.md)

## Weight decay
Aliases: regularization
Module: 01-foundations
Related: Optimizer; Generalization; Learning rate

### What it means
Weight decay shrinks parameters as part of the update. It can discourage excessively large weights; its relationship to an L2 loss penalty depends on the optimizer.

### Why it matters
Decoupled weight decay makes shrinkage explicit rather than routing it through an adaptive gradient transformation.

### Concrete example
A simple decoupled step contains a factor like w←(1−eta*lambda)w before or alongside the gradient update.

### Common mistake
Not every parameter group should necessarily use identical decay. Record exclusions such as biases or normalization weights when used.

### Check your understanding
Why can L2 regularization and decoupled decay differ under an adaptive optimizer?

[Full module and primary references](../modules/01-foundations.md)

## Generalization
Aliases: generalize; generalization failure; held-out; held out
Module: 01-foundations
Related: Overfitting; Data leakage; Evaluation

### What it means
Generalization is performance on data outside the training examples under a specified evaluation distribution. It is always relative to that distribution.

### Why it matters
A training system should learn a useful rule, not merely reduce loss on examples it has already seen.

### Concrete example
An arithmetic model trained on short sums may succeed on new short sums but fail on longer inputs; these are different tests of transfer.

### Common mistake
A random split can contain near duplicates or shared templates and overstate generalization.

### Check your understanding
Which split would test transfer to unseen arithmetic templates?

[Full module and primary references](../modules/01-foundations.md)

## Overfitting
Aliases: overfit; memorization; random labels
Module: 01-foundations
Related: Generalization; Loss; Weight decay

### What it means
Overfitting occurs when fitting the training data does not yield comparable performance on relevant unseen data. High-capacity models can also fit arbitrary labels.

### Why it matters
Intentionally overfitting one tiny batch is a valuable correctness test, but it is not evidence of generalization.

### Concrete example
If training loss keeps decreasing while held-out loss worsens, investigate memorization, distribution mismatch, and the evaluation setup.

### Common mistake
A training/validation gap has several possible causes. Diagnose it rather than assuming one regularizer will fix it.

### Check your understanding
What does successful random-label fitting establish, and what does it fail to establish?

[Full module and primary references](../modules/01-foundations.md)

## Token
Aliases: tokens; tokenization; tokenizer; vocabulary; BPE
Module: 02-transformer
Related: Embedding; Perplexity; Pretraining
Video: https://www.youtube.com/watch?v=SQ3fZ1sAqXI

### What it means
A token is a discrete unit in the model’s vocabulary. Tokenization maps text to IDs; byte-pair encoding builds a vocabulary through repeated merges of common adjacent units.

### Why it matters
Tokenization affects sequence length, representation, loss units, and compute accounting. It is part of the model specification.

### Concrete example
The same sentence can require different token counts under different tokenizers. A batch budget in tokens is therefore not a fixed number of characters.

### Common mistake
Train tokenizer statistics only on permitted training data. Preserve deterministic behavior, special tokens, and Unicode round trips.

### Check your understanding
Why is token perplexity not directly comparable across different tokenizers?

[Full module and primary references](../modules/02-transformer.md)

## Embedding
Aliases: embeddings; hidden width
Module: 02-transformer
Related: Token; Tensor; Parameter
Video: https://www.youtube.com/watch?v=ptFiH_bHnJw

### What it means
An embedding maps a discrete token ID to a learned vector. The embedding table has one vector per vocabulary entry.

### Why it matters
This converts symbols into representations that subsequent differentiable layers can process.

### Concrete example
With vocabulary size 8,000 and width 256, an untied input embedding table contains 2,048,000 parameters.

### Common mistake
Input embeddings may share weights with the output projection. Account for tying when counting parameters.

### Check your understanding
How does doubling vocabulary size affect this table’s memory at fixed width?

[Full module and primary references](../modules/02-transformer.md)

## Parameter
Aliases: parameters; weights; model weights
Module: 01-foundations
Related: Optimizer; Activation; Precision

### What it means
Parameters are learned values adjusted by optimization, such as matrix entries and biases. Activations are intermediate values computed from inputs and parameters.

### Why it matters
Parameter count influences memory and compute, but does not include all memory needed during training.

### Concrete example
A 100×200 linear weight matrix has 20,000 parameters; its batch-dependent output activations are separate.

### Common mistake
Optimizer states, gradients, master copies, and activations can dominate the storage beyond the weights alone.

### Check your understanding
Why can a model fit for inference but fail to fit for full-parameter training?

[Full module and primary references](../modules/01-foundations.md)

## Attention
Aliases: self-attention; attention scores; Q; K; V
Module: 02-transformer
Related: Causal mask; Softmax; Transformer; KV cache
Video: https://www.youtube.com/watch?v=ptFiH_bHnJw

### What it means
Attention combines value vectors using weights derived from query–key compatibility. Scaled dot-product attention uses softmax(QKᵀ/sqrt(d_head)+mask)V.

### Why it matters
Each position can condition its representation on permitted other positions instead of using only a fixed local neighborhood.

### Concrete example
With B batches, H heads, T positions, and head width d, scores have shape B×H×T×T before multiplying by V.

### Common mistake
A visual mask shows allowed positions, not the learned attention weights. Quadratic score storage can be expensive.

### Check your understanding
Why does a causal mask need to be applied before softmax?

[Full module and primary references](../modules/02-transformer.md)

## Causal mask
Aliases: causal attention; masking; mask; masks; causal invariance
Module: 02-transformer
Related: Attention; Next-token prediction; Padding; SFT
Video: https://www.youtube.com/watch?v=ptFiH_bHnJw

### What it means
A causal attention mask prevents a position from reading future input positions. It enforces the information boundary for ordinary autoregressive prediction.

### Why it matters
Without that boundary, training can leak target information unavailable at generation time.

### Concrete example
For zero-indexed query position 3, keys 0 through 3 are allowed. A length-8 sequence has 36 allowed query–key pairs including the diagonal.

### Common mistake
Attention masks, padding masks, and supervised-label masks serve different purposes. Correct one does not imply the others are correct.

### Check your understanding
Changing the last input token should affect which earlier outputs when dropout is disabled?

[Full module and primary references](../modules/02-transformer.md)

## Next-token prediction
Aliases: target shifting; shifted targets; autoregressive; next-token
Module: 02-transformer
Related: Causal mask; Token; Cross-entropy
Video: https://www.youtube.com/watch?v=ptFiH_bHnJw

### What it means
Autoregressive language modeling predicts each token from its prefix: p(x)=product_t p(x_t|x_<t). Inputs and target labels must be aligned accordingly.

### Why it matters
The training example must not let a position simply copy the token it is supposed to predict.

### Concrete example
Given tokens [A,B,C,D], a simple setup uses inputs [A,B,C] and targets [B,C,D], with a causal decoder.

### Common mistake
Special tokens, document boundaries, and packing complicate a naive one-position shift. Hand-check short examples.

### Check your understanding
How can a label-shift bug produce low training loss without useful generation?

[Full module and primary references](../modules/02-transformer.md)

## Transformer
Aliases: transformers; decoder; decoder-only
Module: 02-transformer
Related: Attention; Residual connection; Normalization; Activation
Video: https://www.youtube.com/watch?v=ptFiH_bHnJw

### What it means
A transformer composes attention, feed-forward transformations, residual connections, and normalization. A causal decoder is configured to predict from available prefixes.

### Why it matters
Its architecture determines both information flow and major computation/memory costs.

### Concrete example
A minimal block adds attention output to its residual stream, then adds a feed-forward result, with normalization placed according to the architecture.

### Common mistake
The original transformer architecture and modern decoder-only LMs differ. Specify the actual block rather than treating all variants as identical.

### Check your understanding
Which component makes each token able to incorporate information from distant permitted tokens?

[Full module and primary references](../modules/02-transformer.md)

## Residual connection
Aliases: residual; residuals; residual stream
Module: 02-transformer
Related: Transformer; Gradient; Normalization
Video: https://www.youtube.com/watch?v=ptFiH_bHnJw

### What it means
A residual connection adds a transformation to its input, commonly written y=x+f(x). It provides a direct information and gradient path alongside the learned transformation.

### Why it matters
Deep models can modify a running representation through incremental updates instead of repeatedly reconstructing it from scratch.

### Concrete example
If f(x)=0, the block preserves x. That simple property helps explain why residual initialization and scaling matter.

### Common mistake
A residual path does not automatically prevent exploding activations or guarantee easy optimization.

### Check your understanding
What does the derivative of x+f(x) contain that the derivative of f(x) alone does not?

[Full module and primary references](../modules/02-transformer.md)

## Normalization
Aliases: LayerNorm; RMSNorm; normalizing
Module: 02-transformer
Related: Activation; Tensor; Precision
Video: https://www.youtube.com/watch?v=ptFiH_bHnJw

### What it means
Normalization transforms activations using statistics over specified axes. LayerNorm centers and scales; RMSNorm scales by a root-mean-square statistic without mean subtraction.

### Why it matters
It changes numerical scales and optimization behavior. The axis and epsilon are part of the operation.

### Concrete example
For token-wise normalization, statistics usually span hidden features within each token rather than mixing unrelated examples in the batch.

### Common mistake
Normalizing the wrong axis can silently change the architecture. Low precision and epsilon choices affect edge cases.

### Check your understanding
Why must a normalization parity test include constant or near-zero inputs?

[Full module and primary references](../modules/02-transformer.md)

## KV cache
Aliases: cache; caching; cached
Module: 02-transformer
Related: Attention; Sampling; Activation
Video: https://www.youtube.com/watch?v=ptFiH_bHnJw

### What it means
During autoregressive generation, a KV cache stores past keys and values so they need not be recomputed for every new token. Other caches, such as evaluation caches, store different objects.

### Why it matters
It can accelerate generation while consuming memory that grows with stored context, layers, batch, and KV heads.

### Concrete example
After generating ten tokens, a new query can attend to saved keys and values for the prefix plus those for the current token.

### Common mistake
A KV cache is not the same as training activation storage. Evaluation response caches must also be keyed by model and task configuration.

### Check your understanding
Why should cached and uncached generation agree on logits with stochastic layers disabled?

[Full module and primary references](../modules/02-transformer.md)

## Activation
Aliases: activations; activation memory; activation checkpointing
Module: 04-systems
Related: Parameter; Checkpoint; Transformer
Video: https://www.youtube.com/watch?v=l1RJcDjzK8M

### What it means
Activations are intermediate values produced in the forward pass. Backpropagation needs some of them; activation checkpointing trades recomputation for storing fewer intermediates.

### Why it matters
For large batches or long sequences, activation memory can exceed parameter storage.

### Concrete example
Instead of storing every layer’s intermediates, save selected boundaries and recompute the missing parts during backward.

### Common mistake
Activation checkpointing differs from saving a training checkpoint to disk. It usually reduces memory at additional compute cost.

### Check your understanding
Which parts of memory grow with sequence length even when parameter count stays fixed?

[Full module and primary references](../modules/04-systems.md)

## Pretraining
Aliases: pre-training; pretrained; pre-trained
Module: 03-pretraining
Related: Next-token prediction; Data curation; Scaling laws

### What it means
Pretraining learns representations and predictive behavior from a broad initial training objective and dataset. For a causal LM, the common objective is next-token prediction.

### Why it matters
Later adaptation depends heavily on what the initial model has learned from its data and optimization process.

### Concrete example
A small course model can pretrain on tens of millions of tokens to investigate a curation mechanism, without approaching frontier capability.

### Common mistake
A model trained on a narrow synthetic corpus is not evidence of broad language competence. Describe the distribution and scale.

### Check your understanding
What should stay controlled when testing whether a data filter helps pretraining?

[Full module and primary references](../modules/03-pretraining.md)

## Data curation
Aliases: curation; filtering; filters; data quality; corpus; aggregation
Module: 03-pretraining
Related: Provenance; Deduplication; Data leakage; Ablation

### What it means
Data curation makes explicit decisions about sourcing, cleaning, inclusion, quality, and mixture composition. Aggregation combines sources while preserving enough metadata to audit those decisions.

### Why it matters
The pipeline changes what the model sees and can introduce systematic biases or accidental evaluation overlap.

### Concrete example
Log each document’s source, normalization, rejection reasons, duplicate group, and split; compare metrics before and after filtering.

### Common mistake
A simple proxy such as length or language is not a universal quality measure. Inspect what the filter removes.

### Check your understanding
How could lower loss after filtering reflect easier data rather than improved generalization?

[Full module and primary references](../modules/03-pretraining.md)

## Provenance
Aliases: manifest; manifests; source revision; data lineage
Module: 03-pretraining
Related: Data curation; Shard; Checkpoint

### What it means
Provenance records where an artifact came from and how it was transformed. A manifest is a structured inventory of sources, versions, counts, and relevant metadata.

### Why it matters
A result is difficult to audit or reproduce when the underlying dataset changes silently.

### Concrete example
Record source URL/revision, document IDs, content hashes, transformation configuration, and token counts for each shard.

### Common mistake
A hash identifies content but does not establish data quality or permission to redistribute it.

### Check your understanding
Which provenance fields would let another learner reproduce your curated corpus?

[Full module and primary references](../modules/03-pretraining.md)

## Deduplication
Aliases: duplicates; duplicate; near duplicates; near-duplicate; deduplicate
Module: 03-pretraining
Related: Data leakage; Data curation; Generalization

### What it means
Deduplication identifies repeated or highly similar examples. Exact matching and approximate near-duplicate detection address different forms of repetition.

### Why it matters
Duplicates affect effective diversity and can leak training content into evaluation even when row IDs differ.

### Concrete example
Use normalized-content hashes for exact copies; token shingles and similarity estimates can identify near copies for further review.

### Common mistake
Approximate thresholds produce false positives and negatives. Audit both and group related documents before defining new splits.

### Check your understanding
Why can random row splitting fail even when no row ID appears twice?

[Full module and primary references](../modules/03-pretraining.md)

## Data leakage
Aliases: leakage; contamination; test contamination
Module: 03-pretraining
Related: Deduplication; Evaluation; Generalization

### What it means
Leakage occurs when training or model selection uses information that should be unavailable for the claimed evaluation. Contamination is one route, such as duplicated test content in training.

### Why it matters
It can make a system appear to generalize while it is exploiting privileged information.

### Concrete example
A model trained on paraphrases of evaluation questions may score well even if exact-string duplicate checks pass.

### Common mistake
Leakage can enter through preprocessing, template generation, cached outputs, or repeated decisions based on test results.

### Check your understanding
Which of your pipeline decisions must be fixed before looking at test performance?

[Full module and primary references](../modules/03-pretraining.md)

## Shard
Aliases: shards; sharding; streaming
Module: 03-pretraining
Related: Provenance; Checkpoint; FSDP

### What it means
A data shard is a manageable partition of a dataset. Streaming processes records incrementally rather than loading everything at once. Model-state sharding is a related partitioning idea applied to different objects.

### Why it matters
Shards enable parallel reading, restartable processing, and bounded memory use.

### Concrete example
An interrupted writer can finalize completed shards and resume from a documented position, rather than silently duplicating all previously processed records.

### Common mistake
Data sharding alone does not guarantee balanced workers or independent examples. Count records and preserve ordering/sampling semantics.

### Check your understanding
How would you detect that resuming ingestion duplicated a shard?

[Full module and primary references](../modules/03-pretraining.md)

## Batch size
Aliases: batch; batches; microbatch; effective batch
Module: 04-systems
Related: Gradient accumulation; DDP; Padding
Video: https://www.youtube.com/watch?v=l1RJcDjzK8M

### What it means
Batch size describes how many examples contribute to an operation or update. Microbatch, per-worker batch, global batch, and valid-token batch are different counts.

### Why it matters
The loss denominator and effective update budget must agree with what was actually processed.

### Concrete example
Two workers with microbatch 4 and eight accumulation steps yield 64 sequences per global update if every contribution is equal.

### Common mistake
Variable-length or padded examples can make sequence counts misleading. A mean of local token means is not always a global token mean.

### Check your understanding
How should gradients be weighted if workers have different numbers of valid tokens?

[Full module and primary references](../modules/04-systems.md)

## Gradient accumulation
Aliases: accumulation; accumulated gradients
Module: 04-systems
Related: Batch size; Optimizer; DDP
Video: https://www.youtube.com/watch?v=l1RJcDjzK8M

### What it means
Gradient accumulation combines gradients from multiple microbatches before applying an optimizer update. It lets the effective batch exceed what fits in one forward/backward pass.

### Why it matters
Correct scaling can approximate a larger batch while controlling memory, but the equivalence depends on model behavior and reduction semantics.

### Concrete example
With four equal microbatches contributing to a mean loss, scale each contribution appropriately before the one optimizer step.

### Common mistake
Dropout, batch-dependent layers, uneven token counts, and stepping a scheduler too often can break simple equivalence.

### Check your understanding
Why should an initial equivalence test disable stochastic layers?

[Full module and primary references](../modules/04-systems.md)

## DDP
Aliases: distributed data parallel; all-reduce; all reduce; replicas
Module: 04-systems
Related: Batch size; FSDP; Straggler; Throughput
Video: https://www.youtube.com/watch?v=l1RJcDjzK8M

### What it means
Distributed data parallel training keeps a model replica on each worker and combines gradients across workers so updates remain consistent.

### Why it matters
It scales data processing but does not pool GPU memory into one large device. Communication and stragglers affect throughput.

### Concrete example
Each of the two home PCs can process part of a global batch; compare the combined update to a deterministic one-process reference.

### Common mistake
The smaller GPU constrains replicated workloads, and Ethernet synchronization may make both machines slower than the 5090 alone.

### Check your understanding
What must match to compare distributed and single-process gradients fairly?

[Full module and primary references](../modules/04-systems.md)

## FSDP
Aliases: fully sharded data parallel; ZeRO; reduce-scatter; all-gather
Module: 04-systems
Related: DDP; Parameter; Optimizer; Throughput
Video: https://www.youtube.com/watch?v=l1RJcDjzK8M

### What it means
Fully sharded data parallel training partitions model state across workers and materializes required pieces through communication. ZeRO-style approaches partition different combinations of optimizer state, gradients, and parameters.

### Why it matters
Sharding can reduce per-device state memory when replication is too expensive.

### Concrete example
A worker may gather parameters for a layer, compute with them, and redistribute gradient contributions instead of storing full persistent state everywhere.

### Common mistake
Memory savings come with communication and implementation tradeoffs. Different sharding strategies do not have identical costs.

### Check your understanding
Why might sharding over a slow home network save memory while hurting wall time?

[Full module and primary references](../modules/04-systems.md)

## Straggler
Aliases: stragglers; slow rank; rank; worker
Module: 04-systems
Related: DDP; Profiling; Throughput
Video: https://www.youtube.com/watch?v=l1RJcDjzK8M

### What it means
A straggler is a worker that delays a synchronized computation. A rank identifies a process in the distributed group.

### Why it matters
A fast GPU can spend much of its time waiting for slower compute, input delivery, or communication on another rank.

### Concrete example
Inject a sleep on one rank and inspect whether the other appears busy computing or blocked in a collective.

### Common mistake
Overall step time alone cannot identify the cause. Compare per-rank traces and data/communication timing.

### Check your understanding
What evidence separates a slow disk on one worker from slow network communication?

[Full module and primary references](../modules/04-systems.md)

## Checkpoint
Aliases: checkpoints; checkpointing; resume; recovery
Module: 03-pretraining
Related: Optimizer; Provenance; Shard; Activation

### What it means
A training checkpoint stores enough state to continue a run. It commonly includes model/optimizer state, scheduler progress, random states, and data position.

### Why it matters
Reliable resume prevents lost compute and supports comparable continuation after interruption.

### Concrete example
Save at step k, reload into a fresh process, and compare the next update against an uninterrupted reference with controlled randomness.

### Common mistake
Saving weights alone is useful for inference but may not reproduce training continuation. In distributed runs, consistency across shards matters.

### Check your understanding
What happens if weights resume from step k but the data loader resumes from the beginning?

[Full module and primary references](../modules/03-pretraining.md)

## Precision
Aliases: dtype; float32; float64; BF16; FP16; mixed precision
Module: 04-systems
Related: Finite differences; Softmax; Parameter
Video: https://www.youtube.com/watch?v=l1RJcDjzK8M

### What it means
Numerical precision specifies how values are represented, including range and resolution. Mixed-precision training uses different formats for selected calculations and stored states.

### Why it matters
Lower precision can improve speed and memory use, but increases the importance of stable reductions and appropriate comparisons.

### Concrete example
Use float64 for a tiny numerical gradient check; test a lower-precision training path against a justified tolerance rather than exact equality.

### Common mistake
The same byte width does not imply the same range or mantissa. BF16 and FP16 have different behavior.

### Check your understanding
Why may subtracting nearly equal loss values be unreliable in a low-precision gradient check?

[Full module and primary references](../modules/04-systems.md)

## Profiling
Aliases: profile; profiler; trace; traces; bottleneck
Module: 04-systems
Related: Kernel; Throughput; Straggler
Video: https://www.youtube.com/watch?v=l1RJcDjzK8M

### What it means
Profiling measures where time or resources are spent. A bottleneck is the limiting component for the workload and configuration being studied.

### Why it matters
Optimizing a fast, nonlimiting kernel can have little effect on total training time.

### Concrete example
If data loading consumes half the step, cutting a small attention subroutine’s time in half may barely change overall throughput.

### Common mistake
Asynchronous execution, warmup, compilation, and synchronization can produce misleading measurements.

### Check your understanding
Which end-to-end metric would verify that your kernel improvement actually matters?

[Full module and primary references](../modules/04-systems.md)

## Kernel
Aliases: kernels; Triton; CUDA kernel; FlashAttention
Module: 04-systems
Related: Profiling; Attention; Precision
Video: https://www.youtube.com/watch?v=l1RJcDjzK8M

### What it means
A GPU kernel is a program executed across many GPU threads or work items. Kernel design balances arithmetic, memory movement, parallelism, and launch overhead.

### Why it matters
Many training operations are limited by moving data rather than by the number of arithmetic operations alone.

### Concrete example
A fused normalization kernel can avoid writing and rereading intermediates. IO-aware attention reorganizes work to reduce expensive memory traffic.

### Common mistake
A faster forward microbenchmark does not establish a faster complete training step or a correct backward pass.

### Check your understanding
Which shapes, dtypes, and gradient checks belong in your kernel’s correctness envelope?

[Full module and primary references](../modules/04-systems.md)

## Throughput
Aliases: tokens per second; GPU-hours; FLOPs; compute budget
Module: 04-systems
Related: Profiling; Batch size; Evaluation
Video: https://www.youtube.com/watch?v=l1RJcDjzK8M

### What it means
Throughput is completed work per unit time, such as valid tokens per second. FLOPs count floating-point operations; GPU-hours sum elapsed device usage.

### Why it matters
A compute estimate, a hardware peak, and a measured end-to-end rate answer different questions.

### Concrete example
Four GPUs running two hours consume eight GPU-hours. Estimate remaining wall time from remaining tokens divided by measured end-to-end tokens per second.

### Common mistake
Padding, evaluation, checkpointing, and rollout generation can be excluded accidentally. State exactly what is counted.

### Check your understanding
Can higher processed-token throughput coincide with lower useful-token throughput?

[Full module and primary references](../modules/04-systems.md)

## Scaling laws
Aliases: scaling law; scaling; iso-compute
Module: 05-scaling-evaluation
Related: Pretraining; Throughput; Ablation

### What it means
Scaling laws are empirical relationships between model performance and resources such as parameter count, data, or compute within a studied regime. Iso-compute compares configurations at approximately fixed compute.

### Why it matters
They help reason about allocation and predictions, but depend on assumptions and measurement coverage.

### Concrete example
Under the rough dense-training model C≈6ND, increasing parameter count requires fewer training tokens to keep C fixed.

### Common mistake
A tiny sparse sweep cannot justify a precise frontier prediction. Fit residuals and sensitivity matter.

### Check your understanding
Why is fitting five free parameters to six noisy measurements fragile?

[Full module and primary references](../modules/05-scaling-evaluation.md)

## Evaluation
Aliases: benchmark; benchmarks; test set; validation; metric; metrics
Module: 05-scaling-evaluation
Related: Data leakage; Confidence interval; Sampling

### What it means
Evaluation defines how performance is measured on a specified task distribution. It includes prompts, splits, generation settings, parsing, exclusions, and aggregation.

### Why it matters
A headline number is only interpretable when its protocol is clear and reproducible.

### Concrete example
If 60 of 100 prompts are correct and 10 responses are invalid, accuracy is 0.60 when invalid outputs count as failures.

### Common mistake
Changing the denominator, cache identity, or answer extractor can change rankings without changing model ability.

### Check your understanding
Why should test data be protected from repeated tuning decisions?

[Full module and primary references](../modules/05-scaling-evaluation.md)

## Perplexity
Aliases: nats
Module: 05-scaling-evaluation
Related: Cross-entropy; Token; Evaluation

### What it means
Perplexity is exp(mean negative log-likelihood) when the loss uses natural logarithms. A nat is the information unit associated with natural logs.

### Why it matters
It is a useful prediction metric when the tokenization and evaluation distribution are comparable.

### Concrete example
A mean token loss of ln(4) corresponds to perplexity 4. This is an effective uncertainty summary, not literal uniform choice among four tokens at every step.

### Common mistake
Different tokenizations change the units and segmentation of the loss. Compare appropriately normalized alternatives when needed.

### Check your understanding
Does lower perplexity necessarily mean better performance on a reasoning benchmark?

[Full module and primary references](../modules/05-scaling-evaluation.md)

## Confidence interval
Aliases: uncertainty; bootstrap; seed; seeds; variance
Module: 05-scaling-evaluation
Related: Evaluation; Ablation; Generalization

### What it means
Uncertainty estimates describe variability under stated assumptions. Resampling examples and repeating training seeds measure different sources of variation.

### Why it matters
They prevent overinterpreting a tiny measured difference as a robust improvement.

### Concrete example
For paired model predictions, resample paired examples when estimating uncertainty in their difference; separately show results across training seeds.

### Common mistake
Zero plug-in standard error at zero observed successes does not establish certainty about the underlying success probability.

### Check your understanding
Can a narrow example-level interval rule out large variation across training runs?

[Full module and primary references](../modules/05-scaling-evaluation.md)

## Ablation
Aliases: ablations; baseline; intervention; controlled experiment
Module: 05-scaling-evaluation
Related: Data curation; Scaling laws; Evaluation

### What it means
An ablation or controlled comparison changes a component to test its contribution. The baseline and controlled variables define what causal interpretation is plausible.

### Why it matters
Without a fair baseline, a better score may come from more compute, different data, or tuning effort rather than the claimed idea.

### Concrete example
To test filtering, hold the model, tokenizer, training-token budget, and evaluation policy fixed, then vary the curation choice.

### Common mistake
Changing one configuration field may still change several effective quantities, such as epochs or data diversity.

### Check your understanding
What confound remains if two conditions share steps but have different batch sizes?

[Full module and primary references](../modules/05-scaling-evaluation.md)

## SFT
Aliases: supervised fine-tuning; supervised finetuning; supervised adaptation; assistant-only
Module: 06-sft
Related: Padding; LoRA; Reference policy; Cross-entropy
Video: https://www.youtube.com/watch?v=Dfu7vC9jo4w

### What it means
Supervised fine-tuning trains a model on demonstrations of desired responses. In chat tasks, the template and supervised-token mask define exactly what it learns to predict.

### Why it matters
It can establish task behavior and provide a starting policy for preference learning or RL.

### Concrete example
A prompt with 20 tokens and a response with five tokens may supervise only the five response positions, including EOS if specified.

### Common mistake
Prompt masking and attention masking are different. Truncation can remove the entire intended response.

### Check your understanding
How would you check the active labels without trusting the trainer’s defaults?

[Full module and primary references](../modules/06-sft.md)

## Padding
Aliases: padded; valid tokens; EOS; truncation; packing
Module: 06-sft
Related: SFT; Causal mask; Batch size
Video: https://www.youtube.com/watch?v=Dfu7vC9jo4w

### What it means
Padding fills batches to compatible shapes; valid-token masks distinguish real content from filler. EOS marks sequence completion, while truncation cuts content to a limit. Packing places multiple sequences into an efficient representation.

### Why it matters
These choices affect attention access, loss denominators, and what examples actually reach the optimizer.

### Concrete example
A response-only mean loss should exclude padded labels even if the padded tensor has the same shape as the response.

### Common mistake
Masking padding in the loss does not automatically stop attention across unintended packed-document boundaries.

### Check your understanding
What should happen when truncation leaves zero supervised tokens in an example?

[Full module and primary references](../modules/06-sft.md)

## LoRA
Aliases: adapter; adapters; adapter tuning; low-rank
Module: 06-sft
Related: Parameter; Optimizer; SFT
Video: https://www.youtube.com/watch?v=Dfu7vC9jo4w

### What it means
LoRA represents a trainable weight update with low-rank factors rather than optimizing every entry of the original weight matrix.

### Why it matters
It reduces trainable state and can make adaptation practical with limited memory.

### Concrete example
For an m×n weight and rank r factors, the update adds r(m+n) trainable parameters rather than mn, ignoring biases.

### Common mistake
Lower optimizer memory does not remove activation or reference-model memory. Adapter tuning is a constrained update family, not full-parameter equivalence.

### Check your understanding
How many trainable values are added for a 100×200 matrix with rank 4?

[Full module and primary references](../modules/06-sft.md)

## Policy
Aliases: policies; action; actions; state; MDP
Module: 07-rl
Related: Reward; Rollout; Policy gradient; Sampling

### What it means
A policy maps a state or context to a distribution over actions. In language generation, the prefix is a context and the next token is an action. An MDP formalizes dynamics, actions, states, and rewards.

### Why it matters
Policy optimization changes behavior under the sampling and reward process, rather than fitting only fixed demonstrations.

### Concrete example
A two-action bandit policy can use p(A)=sigmoid(z), leaving probability 1−p(A) for B.

### Common mistake
The model’s conditional policy and the actual sampling procedure can differ when temperature or truncation is applied.

### Check your understanding
Which policy distribution generated your recorded rollout log probabilities?

[Full module and primary references](../modules/07-rl.md)

## Reward
Aliases: rewards; return; returns; discounted return
Module: 07-rl
Related: Reward hacking; Advantage; Policy gradient

### What it means
A reward is a feedback signal for a transition or outcome. Return aggregates rewards over a trajectory, often with a discount factor.

### Why it matters
The signal determines what policy optimization is encouraged to do, which may differ from the real goal.

### Concrete example
With rewards 1 now and 2 one step later and discount 0.9, a two-step return is 1+0.9×2=2.8.

### Common mistake
Increasing a proxy reward is not evidence of improved task success unless independently evaluated.

### Check your understanding
How could rewarding answer length distort a policy’s behavior?

[Full module and primary references](../modules/07-rl.md)

## Policy gradient
Aliases: policy gradients; REINFORCE; score-function estimator
Module: 07-rl
Related: Policy; Advantage; Entropy

### What it means
A policy-gradient estimator uses derivatives of action log probabilities weighted by returns or advantages to estimate a change in expected return.

### Why it matters
It provides a way to optimize sampled, discrete actions without differentiating through the action choice itself.

### Concrete example
For rewards A=3 and B=1 with p(A)=sigmoid(z), expected reward is 1+2p and its derivative is 2p(1−p).

### Common mistake
An estimator can have the right expectation but high variance. Sampling assumptions and baseline dependence matter.

### Check your understanding
What exact small problem would let you verify your Monte Carlo estimator’s sign and scale?

[Full module and primary references](../modules/07-rl.md)

## Advantage
Aliases: advantages; value; value function; actor-critic; GAE
Module: 07-rl
Related: Policy gradient; PPO; Termination; GRPO

### What it means
Advantage compares an action’s expected return with a state-dependent baseline, commonly A(s,a)=Q(s,a)−V(s). Practical algorithms estimate it from sampled rewards and value predictions.

### Why it matters
Centering the update signal can reduce estimator variance and identify actions better than the current state’s expectation.

### Concrete example
A return estimate 5 and baseline 3 produce an advantage estimate 2. GAE combines temporal-difference residuals with a tunable decay.

### Common mistake
A biased or incorrectly bootstrapped value estimate changes the learning signal. Terminal and truncated trajectories require care.

### Check your understanding
Why can subtracting an action-independent baseline preserve an expected policy gradient?

[Full module and primary references](../modules/07-rl.md)

## Termination
Aliases: terminal; truncated; bootstrapping; truncation in RL
Module: 07-rl
Related: Advantage; Reward; PPO

### What it means
True termination ends the modeled episode; a time-limit truncation may stop data collection while the underlying process could continue. Bootstrapping estimates unobserved future value.

### Why it matters
Treating every cutoff as zero future value can bias a critic and its resulting advantages.

### Concrete example
If an environment is still active when a collection time limit is reached, its final observation may be needed to estimate continuation value.

### Common mistake
The right treatment depends on the task’s horizon and API semantics; a genuine finite-horizon endpoint differs from an artificial cutoff.

### Check your understanding
Which value target should change when a timeout is replaced by a true terminal event?

[Full module and primary references](../modules/07-rl.md)

## PPO
Aliases: proximal policy optimization; clipping; importance ratio
Module: 08-alignment
Related: Advantage; Reference policy; KL divergence; Rollout
Video: https://www.youtube.com/watch?v=Dfu7vC9jo4w

### What it means
PPO optimizes a surrogate based on the ratio between current action probability and the probability under the policy that generated the rollout, with clipping to discourage large changes.

### Why it matters
It permits several controlled optimization passes over a rollout batch while monitoring how far the current policy moves.

### Concrete example
If old probability is 0.2 and current probability 0.3, the ratio is 1.5. The effect of clipping also depends on the sign of the advantage.

### Common mistake
Clipping is not a hard guarantee of a bounded KL divergence. The rollout policy and fixed RLHF reference serve different roles.

### Check your understanding
Before the first update on fresh rollouts, what should the importance ratios be?

[Full module and primary references](../modules/08-alignment.md)

## Reference policy
Aliases: fixed reference; old policy; rollout policy; current policy
Module: 08-alignment
Related: PPO; SFT; KL divergence; DPO
Video: https://www.youtube.com/watch?v=Dfu7vC9jo4w

### What it means
In text RL, the current policy is optimized, the old policy generated a batch, and a fixed reference may anchor behavior. These are logically distinct roles even if initially identical.

### Why it matters
Using the wrong policy in a ratio or penalty silently changes the objective.

### Concrete example
PPO divides current by old rollout probabilities. An RLHF drift penalty commonly compares the current policy with a fixed SFT reference.

### Common mistake
Freezing the reference is different from periodically updating the rollout policy snapshot. Label versions explicitly.

### Check your understanding
Which model changes after each optimizer step, and which may remain frozen across the entire experiment?

[Full module and primary references](../modules/08-alignment.md)

## KL divergence
Aliases: KL; Kullback-Leibler
Module: 08-alignment
Related: Reference policy; PPO; Entropy
Video: https://www.youtube.com/watch?v=Dfu7vC9jo4w

### What it means
KL divergence measures distributional discrepancy: D_KL(p||q)=sum p log(p/q) where defined. It is directional and generally not symmetric.

### Why it matters
It can describe policy drift, but the direction, sampling distribution, and estimator must be specified.

### Concrete example
If p=q exactly, KL is zero. Moving probability toward outcomes that q considers very unlikely can increase forward KL strongly.

### Common mistake
A sampled log-ratio can be negative on an individual sample even though the exact KL is nonnegative.

### Check your understanding
Why does swapping p and q change the meaning of the penalty?

[Full module and primary references](../modules/08-alignment.md)

## DPO
Aliases: direct preference optimization; preference optimization
Module: 08-alignment
Related: Reference policy; Reward model; Cross-entropy
Video: https://www.youtube.com/watch?v=Dfu7vC9jo4w

### What it means
DPO fits preferred versus rejected responses using differences of current/reference sequence log ratios. In its standard offline form, it trains from fixed preference pairs rather than online rollouts.

### Why it matters
It offers a preference-learning objective whose numerical mechanics can be checked on tiny examples before using a large trainer.

### Concrete example
When current and reference policies match, both response log ratios vanish and the per-pair logistic loss is ln(2).

### Common mistake
Response masking and sequence reduction matter. Replacing sums with means changes length weighting and the objective.

### Check your understanding
What happens to the pairwise log-ratio margin if chosen and rejected responses are swapped?

[Full module and primary references](../modules/08-alignment.md)

## Reward model
Aliases: reward modeling; preferences; preference data; RLHF; alignment
Module: 08-alignment
Related: Reward hacking; DPO; SFT; Evaluation
Video: https://www.youtube.com/watch?v=Dfu7vC9jo4w

### What it means
A reward model learns a scoring rule from feedback such as pairwise preferences. RLHF uses human feedback in a training process that may include reward modeling and policy optimization. Alignment is the broader goal of desirable behavior.

### Why it matters
A learned scorer can generalize imperfectly or encode annotation bias, so optimizing it requires independent behavioral evaluation.

### Concrete example
A pairwise scorer may learn to prefer longer answers if length correlates with labels, even when correctness does not.

### Common mistake
Synthetic labels can teach the mechanics but should not be described as human feedback. Passing a small suite does not establish comprehensive alignment.

### Check your understanding
How would you design preference pairs that separate correctness from response length?

[Full module and primary references](../modules/08-alignment.md)

## Reward hacking
Aliases: proxy; proxy reward; reward exploitation; overoptimization
Module: 08-alignment
Related: Reward model; Verifier; Evaluation
Video: https://www.youtube.com/watch?v=Dfu7vC9jo4w

### What it means
Reward hacking occurs when optimization exploits a scoring rule in a way that fails the intended task. The measured proxy improves while real success does not.

### Why it matters
The evaluator and reward mechanism are active parts of the system, not neutral bookkeeping.

### Concrete example
If the reward only checks whether a response contains “correct,” a policy can emit that marker without answering the question.

### Common mistake
A mitigation tested only on known exploits may leave closely related loopholes. Keep independent held-out behavior checks.

### Check your understanding
What metric would detect the divergence between your reward and the actual goal?

[Full module and primary references](../modules/08-alignment.md)

## RLVR
Aliases: reinforcement learning with verifiable rewards; verifiable rewards; reasoning RL
Module: 09-reasoning-rl
Related: Verifier; GRPO; Sampling; Generalization

### What it means
RLVR trains using a checker for task outcomes where verification is available, such as exact arithmetic or executable tests.

### Why it matters
It can produce scalable feedback, but only to the extent that the checker matches the intended task and cannot be cheaply exploited.

### Concrete example
Generate arithmetic problems with known answers, train on one template family, and evaluate on protected templates and lengths.

### Common mistake
Higher training reward may reflect parser exploits or training-distribution memorization. Count generation compute and evaluate separately.

### Check your understanding
Why might a task that gives zero reward to every sampled response be difficult to learn with a centered group signal?

[Full module and primary references](../modules/09-reasoning-rl.md)

## GRPO
Aliases: group-relative; group relative; group-relative policy optimization; zero-variance
Module: 09-reasoning-rl
Related: Advantage; PPO; RLVR; Rollout

### What it means
Group-relative policy optimization compares multiple sampled responses for the same prompt to construct relative advantage signals. The full objective also specifies ratios, clipping, reductions, and any reference term.

### Why it matters
Comparisons within a prompt can avoid a separate learned value baseline, while creating important reward-variance and normalization edge cases.

### Concrete example
If every reward in a group is identical, subtracting the group mean gives zero for every response.

### Common mistake
The shorthand (r−mean)/(std+epsilon) is not a complete algorithm. Specify standard-deviation convention, group sizes, and token/sequence weighting.

### Check your understanding
What would you test for singleton groups and all-wrong groups before running a large job?

[Full module and primary references](../modules/09-reasoning-rl.md)

## Verifier
Aliases: verifiers; answer extraction; parser; parsing
Module: 09-reasoning-rl
Related: Reward hacking; RLVR; Evaluation

### What it means
A verifier turns a model response into a task-success signal according to explicit rules. Parsing decides which part of the text is being judged.

### Why it matters
An overly permissive or inconsistent checker can become the easiest target for reward optimization.

### Concrete example
For arithmetic, define whether exactly one final answer is required and how whitespace, signs, malformed outputs, and contradictory answers are handled.

### Common mistake
Checking whether the right number appears anywhere can reward a list containing many guesses.

### Check your understanding
Which adversarial responses should your unit tests reject?

[Full module and primary references](../modules/09-reasoning-rl.md)

## Rollout
Aliases: rollouts; trajectory; trajectories; policy version; staleness
Module: 09-reasoning-rl
Related: Policy; PPO; Sampling; Verifier

### What it means
A rollout is sampled interaction data: contexts, actions, outcomes, and the information needed to train from them. In text RL, record generation settings and policy versions alongside token log probabilities.

### Why it matters
Updates rely on knowing the distribution that generated the data; stale or mislabeled samples can violate assumptions.

### Concrete example
A queue entry can carry prompt ID, policy revision, token IDs, old log probabilities, reward-verifier version, and completion status.

### Common mistake
A fast asynchronous queue is not automatically algorithmically correct. Define how much staleness is allowed and how it is handled.

### Check your understanding
What evidence would reveal that a training batch came from an unexpectedly old policy?

[Full module and primary references](../modules/09-reasoning-rl.md)

## Sampling
Aliases: generation; inference; pass@1; pass@k; best-of-k
Module: 09-reasoning-rl
Related: Temperature; Evaluation; Rollout

### What it means
Sampling draws outputs from a model using a specified decoding procedure. Pass@1 evaluates one sample per prompt; pass@k concerns success among multiple attempts.

### Why it matters
Extra attempts or longer outputs can improve apparent success without any parameter update.

### Concrete example
A model with one correct answer among eight tries has best-of-eight success for that prompt, but that does not mean its first try succeeded.

### Common mistake
Record temperature, stopping criteria, number of samples, and token budgets. Do not compare pass@k directly with another model’s pass@1.

### Check your understanding
How would you isolate training improvement from increased inference compute?

[Full module and primary references](../modules/09-reasoning-rl.md)
