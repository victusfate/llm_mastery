import { scalingGraphic, timelineGraphic, intervalGraphic, tokenGraphic, evaluationGraphic, stateGraphic, loraGraphic, networkGraphic, barsGraphic, attentionGraphic, gridGraphic, curveGraphic, corpusGraphic, workersGraphic, maskGraphic, policyGraphic, computationGraphic, transformerGraphic } from './graphics.ts';
import { escapeHTML } from './engine.ts';
// Each sequence shows a specific mechanism or numerical example, not a mastery score.
export const visualSteps:Record<string,string[]> = {
 'Gradient':['L(w) = (w − 3)²','w = 1 → slope = −4','Small positive move lowers L'],
 'Loss':['Correct answer probability: 0.25','−ln(0.25)','Loss ≈ 1.386 nats'],
 'Autograd':['w × x → y','y² → L','Backward: 2y × x → gradient'],
 'Finite differences':['Evaluate L(w − ε)','Evaluate L(w + ε)','Difference ÷ 2ε ≈ slope'],
 'Tensor':['4 examples × 3 features','X has shape [4, 3]','X @ W[3, 2] → [4, 2]'],
 'Logit':['Raw scores: [2, 1, 0]','Scores can be negative or positive','Softmax converts scores to probabilities'],
 'Softmax':['Logits [0, 0]','Exponentials [1, 1]','Normalize → [0.5, 0.5]'],
 'Cross-entropy':['Target class: A','Predicted P(A) = 0.8','−ln(0.8) ≈ 0.223'],
 'Temperature':['Fixed logits [2, 0]','T = 1 → P(A) ≈ 0.88','T = 2 → P(A) ≈ 0.73'],
 'Entropy':['Certain [1, 0] → 0 nats','Uniform [0.5, 0.5]','Entropy ≈ 0.693 nats'],
 'Gradient descent':['Parameter w = 1','Gradient g = −4, rate = 0.1','w − rate × g = 1.4'],
 'Learning rate':['Same gradient: −4','Rate 0.1 → move +0.4','Rate 1 → move +4; may overshoot'],
 'Optimizer':['Current gradient','Optional momentum / state','Parameter update'],
 'Weight decay':['Weight w = 2','Shrink by factor 0.99','w = 1.98 before other updates'],
 'Generalization':['Train on one set','Freeze learning','Test on unseen examples'],
 'Overfitting':['Training loss falls','Held-out loss rises','Model fits training-specific patterns'],
 'Token':['Text: hello world','Tokenizer chooses pieces','Pieces become integer IDs'],
 'Embedding':['Token ID 7','Look up row 7 of a learned table','Vector of d numerical features'],
 'Parameter':['Learned weight w','Compute loss and gradient','Update w; save in checkpoint'],
 'Attention':['Query compared with keys','Softmax produces weights','Weighted sum of values'],
 'Causal mask':['Token 1 sees {1}','Token 2 sees {1, 2}','Token 3 sees {1, 2, 3}'],
 'Next-token prediction':['Input: the cat','Target: cat sat','Each position predicts its successor'],
 'Transformer':['Token embeddings','Attention + feed-forward blocks','Vocabulary scores at each position'],
 'Residual connection':['Input x','Branch computes f(x)','Output x + f(x)'],
 'Normalization':['Activations at a position','Normalize using chosen statistics','Apply learned scale / shift if defined'],
 'KV cache':['Generate token 1: store keys / values','Generate token 2: reuse stored values','Compute new token state and append'],
 'Activation':['Input and parameters','Intermediate result during forward pass','Needed for later computation / backward'],
 'Pretraining':['Curated text tokens','Repeated next-token learning','Base model checkpoint'],
 'Data curation':['Raw documents','Filter → deduplicate → split','Versioned training corpus'],
 'Provenance':['Original source and license','Recorded transformations','Trace an output example back to source'],
 'Deduplication':['Document A, copy A, document B','Hash / similarity comparison','Keep A and B once under chosen policy'],
 'Data leakage':['Test answer enters training','Evaluation includes that answer','Score no longer measures unseen performance'],
 'Shard':['Dataset or tensor','Split into pieces 1, 2, 3','Distribute pieces across storage / workers'],
 'Batch size':['4 examples per device','2 devices × 3 accumulation steps','Effective batch = 24 examples'],
 'Gradient accumulation':['Microbatch 1 backward','Microbatch 2 backward','One update after scaled gradients accumulate'],
 'DDP':['Each device has a full model','Different local minibatches','Synchronize gradients → same update'],
 'FSDP':['Model state divided across devices','Gather needed parameters','Compute and reshard state'],
 'Straggler':['Worker A: 1 second','Worker B: 3 seconds','Synchronized step waits for B'],
 'Checkpoint':['Weights + optimizer + RNG + data position','Persist recoverable state','Resume and verify the next steps'],
 'Precision':['FP32 has greater numerical range than FP16','BF16 keeps FP32 exponent width','Compare overflow and accuracy, not only memory'],
 'Profiling':['Run representative workload','Measure CPU, GPU and communication','Optimize the measured bottleneck'],
 'Kernel':['Tensor operation','GPU program performs its arithmetic','Measure correctness and execution time'],
 'Throughput':['Process 12,000 tokens','Elapsed time: 4 seconds','Throughput: 3,000 tokens / second'],
 'Scaling laws':['Measure several model/data scales','Fit an empirical relationship','Test held-out scales; limit extrapolation'],
 'Evaluation':['Freeze task and metric','Run held-out inputs','Report results, variation and failure cases'],
 'Perplexity':['Mean token loss: ln(4)','Exponentiate the mean loss','Perplexity = 4'],
 'Confidence interval':['Sample observed outcomes','Estimate uncertainty under assumptions','Report a range alongside the estimate'],
 'Ablation':['Baseline system','Change one component','Compare with matched data and budget'],
 'SFT':['Prompt + demonstration','Mask non-target tokens as intended','Learn to predict demonstration tokens'],
 'Padding':['Sequences of lengths 2 and 4','Pad shorter one to 4','Mask padding in attention / loss as needed'],
 'LoRA':['Frozen matrix W','Train low-rank A and B','Effective matrix W + scaled BA'],
 'Policy':['Current context','Distribution over next actions','Sample an action'],
 'Reward':['Model response','Scoring rule or learned evaluator','Scalar feedback; may be imperfect'],
 'Policy gradient':['Sample an action','Compute return-weighted log-probability gradient','Estimate an improvement direction'],
 'Advantage':['Estimated return: 5','Baseline value: 3','Advantage = 2'],
 'Termination':['Environment completes the task','Trajectory ends','Distinguish from a time-limit truncation'],
 'PPO':['Old and new action probabilities','Ratio and advantage','Clipped surrogate discourages some large changes'],
 'Reference policy':['Freeze a comparison model','Evaluate the same response','Measure deviation from reference behavior'],
 'KL divergence':['Two distributions P and Q','Average log(P / Q) under P','Zero for identical distributions'],
 'DPO':['Preferred and rejected responses','Compare policy / reference log-probabilities','Optimize pairwise preference objective'],
 'Reward model':['Human preference pairs','Train a scoring model','Use scores; inspect mis-ranking failures'],
 'Reward hacking':['Proxy rewards long answers','Model adds irrelevant text','Proxy rises while usefulness falls'],
 'RLVR':['Generate a solution','Check with an executable rule','Use verifiable reward for policy learning'],
 'GRPO':['Sample a response group','Compare rewards within that group','Optimize using group-relative advantages'],
 'Verifier':['Candidate program','Run hidden tests in a controlled environment','Pass/fail is evidence within test coverage'],
 'Rollout':['Context → sampled action','Observe continuation / feedback','Record the trajectory'],
 'Sampling':['Distribution [0.7, 0.3]','Draw a random number','Choose A or B; repeated draws vary'],
 'Model':['Input features or tokens','Parameterized computation','Prediction'],
 'Prediction':['Context: the cat','Model assigns next-token probabilities','One possible next token: sat'],
 'Training loop':['Predict → measure loss','Differentiate → update parameters','Repeat and evaluate separately'],
 'Dataset':['Collect examples','Document origins and transformations','Split training, validation and test data'],
};
// Every concept is assigned deliberately; missing artwork is a content error.
export const graphicGroups:Record<string,string[]> = {
 network: ['Model','Parameter','Activation'],
 computation: ['Autograd','Training loop'],
 curve: ['Gradient','Finite differences','Gradient descent','Learning rate','Optimizer','Weight decay'],
 distribution: ['Loss','Logit','Softmax','Cross-entropy','Temperature','Entropy','Perplexity','Prediction','Sampling','Policy'],
 matrix: ['Tensor','Embedding','Normalization','Precision','Kernel','LoRA'],
 attention: ['Attention','Causal mask','KV cache'],
 transformer: ['Transformer','Residual connection','Next-token prediction','Pretraining'],
 corpus: ['Token','Data curation','Provenance','Deduplication','Data leakage','Dataset'],
 workers: ['Shard','Batch size','Gradient accumulation','DDP','FSDP','Straggler','Checkpoint','Profiling','Throughput'],
 evaluation: ['Generalization','Overfitting','Scaling laws','Evaluation','Confidence interval','Ablation'],
 mask: ['SFT','Padding'],
 policy: ['Reward','Policy gradient','Advantage','Termination','PPO','Reference policy','KL divergence','DPO','Reward model','Reward hacking','RLVR','GRPO','Verifier','Rollout'],
};
export function conceptGraphic(title:string):string {
 if(title==='Scaling laws')return scalingGraphic();
 if(['Profiling','Throughput','Straggler','Kernel'].includes(title))return timelineGraphic();
 if(title==='Confidence interval')return intervalGraphic();
 if(['Token','Embedding','Next-token prediction'].includes(title))return tokenGraphic();
 if(['Evaluation','Confidence interval','Ablation','Generalization','Verifier'].includes(title))return evaluationGraphic();
 if(['Shard','FSDP'].includes(title))return stateGraphic(true);
 if(title==='DDP')return stateGraphic();
 if(title==='LoRA')return loraGraphic();
 if(title==='Loss')return barsGraphic([.25,1.386],['P(target)','−ln P'],'Target probability and loss (nats)');
 if(title==='Cross-entropy')return barsGraphic([.8,.223],['P(target)','−ln P'],'Target probability and loss (nats)');
 if(title==='Logit')return barsGraphic([2,1,0],['A','B','C'],'Raw vocabulary scores');
 if(title==='Softmax'||title==='Entropy')return barsGraphic([.5,.5],['A','B'],'Uniform binary probabilities');
 if(title==='Temperature')return barsGraphic([.881,.731],['T = 1','T = 2'],'P(A) for logits [2, 0]');
 if(title==='Advantage')return barsGraphic([5,3,2],['Return','Baseline','Advantage'],'Return minus baseline');
 if(title==='KL divergence')return barsGraphic([.7,.3,.5,.5],['P(A)','P(B)','Q(A)','Q(B)'],'Compare two action distributions');
 const group=Object.entries(graphicGroups).find(([,titles])=>titles.includes(title))?.[0];
 switch(group){
 case 'network': return networkGraphic();
 case 'computation': return computationGraphic();
 case 'curve': return curveGraphic();
 case 'distribution': return barsGraphic([.665,.245,.09],['A','B','C'],'Example next-token probability distribution');
 case 'matrix': return gridGraphic(4,3,'Example tensor: 4 examples × 3 features');
 case 'attention': return attentionGraphic()+gridGraphic(5,5,'Causal attention mask',true);
 case 'transformer': return transformerGraphic();
 case 'corpus': return corpusGraphic();
 case 'workers': return workersGraphic();
 case 'evaluation': return curveGraphic(true);
 case 'mask': return maskGraphic();
 case 'policy': return policyGraphic();
 default: throw new Error(`Missing graphic for ${title}`);
 }
}
export function conceptVisual(title:string):string {
 const steps=visualSteps[title];
 if(!steps)return '';
 return `<figure class="concept-figure"><figcaption>Visual example · ${escapeHTML(title)}</figcaption>${conceptGraphic(title)}<ol class="concept-flow">${steps.map(s=>`<li>${escapeHTML(s)}</li>`).join('')}</ol></figure>`;
}
