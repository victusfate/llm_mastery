import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import * as z from '../src/site/z2h-numerics.ts';
import { NAMES, TOKENIZER_SAMPLE } from '../src/site/z2h-data.ts';
import { lectures } from '../src/site/z2h-track.ts';
import { traceGraphic, matrixGraphic, scatterGraphic, histogramGraphic, seriesGraphic, treeGraphic, tokenRibbonGraphic } from '../src/site/z2h-visuals.ts';
import { runSample } from '../src/site/z2h-worker.ts';
import { liveBlocksOf } from '../src/site/z2h-live-code.ts';
import { isLearningDataKey } from '../src/site/progress-backup.ts';

const guideText=(lecture:{guide:string})=>readFileSync(new URL(lecture.guide,new URL('../docs/zero-to-hero/',import.meta.url)),'utf8');
const pythonBlocks=(text:string)=>[...text.matchAll(/^```python\n([\s\S]*?)^```/gm)].map(match=>match[1]);
const python3Available=(()=>{try{execFileSync('python3',['-c','pass'],{stdio:'ignore'});return true}catch{return false}})();

test('reverse-mode autograd matches finite differences, including reused variables',()=>{
 const variables={a:1.5,b:-2,c:0.5};
 for(const source of ['(a*b + c) * tanh(a)','a*a + a','exp(a)/(1+b*b)','relu(a*b) + sigmoid(c)','a^3 - b/c','-a*(b+c)']){
  const expression=z.parseExpression(source);
  const trace=z.backpropagate(expression,variables);
  assert.ok(Object.keys(trace.grads).length>0,source);
  for(const name of Object.keys(trace.grads)){
   const numeric=z.numericGradient(expression,variables,name);
   assert.ok(Math.abs(trace.grads[name]-numeric)<1e-5,`${source} d/d${name}: ${trace.grads[name]} vs ${numeric}`);
  }
 }
 // A variable used n times accumulates from every path: d(a*a)/da = 2a.
 assert.equal(z.backpropagate(z.parseExpression('a*a'),{a:3}).grads.a,6);
 assert.equal(z.backpropagate(z.parseExpression('a*a*a'),{a:3}).grads.a,27);
 // One node per variable, so the graph shows the fan-out rather than copies.
 assert.equal(z.backpropagate(z.parseExpression('a*a'),{a:3}).nodes.filter(n=>n.op==='input').length,1);
 assert.throws(()=>z.parseExpression('a +'),/ended early/);
 assert.throws(()=>z.parseExpression('mystery(a)'),/Unknown function/);
 assert.throws(()=>z.backpropagate(z.parseExpression('a+q'),{a:1}),/No value supplied/);
});

test('the composed Value graph matches the expression engine and the exercise it mirrors',()=>{
 // The same formula built two ways must agree in value and in every gradient.
 const a=z.value(1.5,'a'),b=z.value(-2,'b'),c=z.value(0.5,'c');
 const composed=a.mul(b).add(c).mul(a.tanh());
 composed.backward();
 const parsed=z.backpropagate(z.parseExpression('(a*b + c) * tanh(a)'),{a:1.5,b:-2,c:0.5});
 assert.ok(Math.abs(composed.data-parsed.value)<1e-12);
 for(const [name,node] of [['a',a],['b',b],['c',c]] as const)
  assert.ok(Math.abs(node.grad-parsed.grads[name])<1e-12,`${name}: ${node.grad} vs ${parsed.grads[name]}`);

 // Gradient accumulates at a fan-out, and backward twice doubles it until the
 // graph is cleared — the behaviour a training loop has to handle.
 const x=z.value(3,'x');
 x.mul(x).backward();
 assert.equal(x.grad,6);
 const y=z.value(3,'y'),loss=y.mul(y);
 loss.backward();
 loss.backward();
 assert.equal(y.grad,12);
 loss.zeroGrad().backward();
 assert.equal(y.grad,6);

 // Every operation checks against central differences through the helper the
 // guide asks learners to write.
 for(const build of [
  ([p,q]:z.Value[])=>p.mul(q).add(p.tanh()).relu().add(q.exp()),
  ([p,q]:z.Value[])=>p.sub(q).div(p.pow(2).add(3)).sigmoid(),
  ([p,q]:z.Value[])=>p.neg().mul(q).add(z.sumValues([p,q,1])).log(),
 ]){
  const check=z.checkValueGradients(build,[0.7,1.3]);
  assert.ok(check.maxError<1e-6,`${check.maxError}: ${check.analytic} vs ${check.numeric}`);
 }

 // Composed graphs draw with the same figure the typed-expression panel uses.
 const trace=z.valueTrace(composed);
 assert.equal(trace.value,composed.data);
 assert.deepEqual(Object.keys(trace.grads).sort(),['a','b','c']);
 assert.ok(trace.nodes.every(node=>node.inputs.every(input=>input<node.id)),'children come before their consumers');
});

test('a composed network trains, and skipping zeroGrad visibly breaks it',()=>{
 const examples=[{inputs:[2,3],target:1},{inputs:[3,-1],target:-1},{inputs:[0.5,1],target:-1},{inputs:[1,1],target:1}];
 const network=new z.Network([2,4,4,1],3);
 assert.equal(network.parameters().length,37);
 const fit=z.fitNetwork(network,examples,{steps:150,learningRate:0.06});
 assert.ok(fit.finalLoss<0.01,`did not overfit four examples: ${fit.finalLoss}`);
 fit.predictions.forEach((prediction,i)=>assert.ok(Math.sign(prediction)===Math.sign(examples[i].target)));
 // Leaving gradients from previous steps in place is the classic bug; it must
 // be reproducible here so the lesson can point at a number.
 const stale=z.fitNetwork(new z.Network([2,4,4,1],3),examples,{steps:150,learningRate:0.06,clearGradients:false});
 assert.ok(stale.finalLoss>fit.finalLoss*10,`${stale.finalLoss} vs ${fit.finalLoss}`);
 // Determinism: the seed fixes the run, so a lesson can quote the loss.
 assert.equal(z.fitNetwork(new z.Network([2,4,4,1],3),examples,{steps:20}).finalLoss,
              z.fitNetwork(new z.Network([2,4,4,1],3),examples,{steps:20}).finalLoss);
});

test('the bigram model is a distribution, beats uniform, and smoothing costs training loss',()=>{
 const model=z.trainBigram(NAMES);
 for(const row of model.probabilities){
  assert.ok(Math.abs(row.reduce((a,b)=>a+b,0)-1)<1e-9);
  assert.ok(row.every(p=>p>0));
 }
 assert.ok(model.loss<z.uniformLoss(model.characters.length),`${model.loss}`);
 assert.ok(z.trainBigram(NAMES,5).loss>model.loss);
 assert.equal(model.characters[0],z.BOUNDARY);
 // Sampling is seeded: the same seed reproduces a lesson's words exactly.
 assert.equal(z.sampleBigram(model,z.rng(7)),z.sampleBigram(model,z.rng(7)));
 const words=Array.from({length:40},(_,i)=>z.sampleBigram(model,z.rng(i+1)));
 assert.ok(words.every(word=>[...word].every(character=>model.characters.includes(character))));
});

test('the browser MLP trains, reports a held-out loss, and counts its own parameters',()=>{
 const run=z.trainCharMLP({words:NAMES,steps:300,hidden:16,seed:4});
 const early=run.lossHistory.slice(0,20).reduce((a,b)=>a+b,0)/20;
 const late=run.lossHistory.slice(-20).reduce((a,b)=>a+b,0)/20;
 assert.ok(late<early-0.3,`loss did not fall: ${early} -> ${late}`);
 assert.ok(run.trainLoss<z.uniformLoss(run.characters.length));
 assert.ok(run.heldOutLoss>0);
 assert.equal(run.embeddings.length,run.characters.length);
 assert.ok(run.embeddings.every(row=>row.length===2&&row.every(Number.isFinite)));
 const vocab=run.characters.length,input=3*2;
 assert.equal(run.parameters,vocab*2+input*16+16+16*vocab+vocab);
 // Deterministic: two runs with one seed give identical numbers.
 assert.equal(z.trainCharMLP({words:NAMES,steps:60,seed:9}).trainLoss,z.trainCharMLP({words:NAMES,steps:60,seed:9}).trainLoss);
});

test('initialisation diagnostics separate saturation, collapse, and normalisation',()=>{
 const large=z.initialisationDiagnostics({gain:3,depth:5});
 const small=z.initialisationDiagnostics({gain:0.3,depth:5});
 const normalised=z.initialisationDiagnostics({gain:3,depth:5,normalised:true});
 assert.ok(large.layers[4].saturatedFraction>0.25,`${large.layers[4].saturatedFraction}`);
 assert.ok(small.layers[4].saturatedFraction<0.01);
 assert.ok(small.layers[4].activationStd<small.layers[0].activationStd/5,'small gain must collapse with depth');
 assert.ok(normalised.layers[4].saturatedFraction<large.layers[4].saturatedFraction/4);
 for(const report of [large,small,normalised])
  for(const layer of report.layers){
   assert.ok(Math.abs(layer.histogram.reduce((a,b)=>a+b,0)-1)<1e-9);
   assert.ok(Number.isFinite(layer.gradientStd)&&layer.gradientStd>0);
  }
});

test('the gradient check passes a correct derivation and localises each broken rule',()=>{
 const correct=z.gradientCheck('correct');
 assert.ok(correct.passed);
 assert.ok(correct.entries.every(entry=>entry.maxError<1e-8),JSON.stringify(correct.entries));
 for(const rule of ['no-batch-mean','no-onehot'] as const){
  const check=z.gradientCheck(rule);
  assert.equal(check.passed,false);
  assert.ok(check.entries.every(entry=>!entry.passed),`${rule} should fail every tensor`);
 }
 // A transposed backward path corrupts the earlier layer while the output layer
 // still checks out, which is why partial checks give false confidence.
 const transposed=z.gradientCheck('transposed-hidden');
 assert.equal(transposed.passed,false);
 assert.deepEqual(transposed.entries.filter(entry=>entry.passed).map(entry=>entry.name),['W2','b2']);
});

test('hierarchical context grows logarithmically and reports its crossover',()=>{
 const plan=z.contextPlan({fanIn:2,depth:3,hidden:64,embedding:16});
 assert.equal(plan.contextLength,8);
 assert.deepEqual(plan.groupsPerLayer,[4,2,1]);
 assert.equal(plan.scaling.length,8);
 // A hierarchy is not automatically cheaper: it loses at short contexts and
 // wins at long ones, so the course claim must name the crossover.
 // One level is the same model either way; from two levels the hierarchy pays
 // for a hidden-to-hidden matrix per level and is the more expensive design.
 assert.equal(plan.scaling[0].hierarchical,plan.scaling[0].flat);
 assert.ok(plan.scaling[1].hierarchical>plan.scaling[1].flat);
 const crossover=plan.scaling.find(point=>point.hierarchical<point.flat);
 assert.ok(crossover&&crossover.contextLength>8,JSON.stringify(plan.scaling));
 for(let i=1;i<plan.scaling.length;i++){
  assert.ok(plan.scaling[i].flat>plan.scaling[i-1].flat);
  assert.ok(plan.scaling[i].hierarchical>plan.scaling[i-1].hierarchical);
 }
});

test('causal attention distributes weight one per query and leaks nothing backwards',()=>{
 const tokens=['the','cat','sat','on','the','mat'];
 const causal=z.selfAttention({tokens,causal:true});
 for(const row of causal.rowSums)assert.ok(Math.abs(row-1)<1e-9);
 causal.weights.forEach((row,i)=>{
  row.forEach((weight,j)=>{
   assert.ok(weight>=0);
   if(j>i)assert.ok(weight<1e-9,`position ${i} attended to future position ${j}`);
  });
 });
 assert.equal(causal.earlierPositionDrift,0);
 // Remove the mask and the same measurement becomes non-zero: the check works.
 assert.ok(z.selfAttention({tokens,causal:false}).earlierPositionDrift>1e-3);
 // Lower temperature sharpens the distribution toward selecting one position.
 const sharp=z.selfAttention({tokens,temperature:0.3});
 const flat=z.selfAttention({tokens,temperature:3});
 assert.ok(Math.max(...sharp.weights[5])>Math.max(...flat.weights[5]));
});

test('byte-pair encoding round trips, compresses, and is deterministic',()=>{
 const model=z.trainBPE(TOKENIZER_SAMPLE,32);
 assert.equal(model.vocabularySize,256+model.merges.length);
 assert.ok(model.compression>1.4,`${model.compression}`);
 for(const probe of ['the tokenizer',' tokenizer','TOKENIZER','1234','café','    indented','','\n\n',
   'a much longer string that the training text never contained at all'])
  assert.equal(z.decodeBPE(model,z.encodeBPE(model,probe)),probe,probe);
 // Merges are learned in frequency order and each one must have occurred twice.
 assert.ok(model.merges.every(merge=>merge.count>1));
 assert.deepEqual(z.trainBPE(TOKENIZER_SAMPLE,12).merges,model.merges.slice(0,12));
 // A leading space is a different token sequence from the bare word.
 assert.notDeepEqual(z.encodeBPE(model,' tokenizer'),z.encodeBPE(model,'tokenizer'));
 assert.deepEqual(z.trainBPE('',8).merges,[]);
});

test('GPT-2 accounting reproduces the published parameter count and prices a run',()=>{
 const counts=z.parameterCount({layers:12,width:768,vocabulary:50257,context:1024});
 assert.equal(counts.total,124439808);
 assert.equal(counts.embedding,50257*768);
 assert.equal(counts.positional,1024*768);
 const budget=z.trainingBudget({parameters:counts.total,tokens:10e9,deviceTflops:400*8,utilisation:0.4,dollarsPerHour:16});
 assert.equal(budget.flops,6*counts.total*10e9);
 assert.equal(budget.chinchillaOptimalTokens,20*counts.total);
 assert.ok(budget.hours>0.5&&budget.hours<10,`${budget.hours}`);
 assert.ok(Math.abs(budget.dollars-budget.hours*16)<1e-6);
 const schedule=z.learningRateSchedule({steps:100,warmup:10,peak:6e-4,floorFraction:0.1});
 assert.equal(schedule.length,100);
 assert.ok(Math.abs(schedule[9]-6e-4)<1e-12,'warmup ends at the peak');
 assert.ok(schedule[0]<schedule[5]&&schedule[5]<schedule[9]);
 for(let i=10;i<99;i++)assert.ok(schedule[i]>schedule[i+1],'cosine decay is monotone after warmup');
 assert.ok(schedule[99]>=6e-5*0.9,'the schedule decays to a floor, not to zero');
});

test('every track figure is a described, finite SVG with labels inside the viewBox',()=>{
 const trace=z.backpropagate(z.parseExpression('(a*b + c) * tanh(a)'),{a:1.5,b:-2,c:0.5});
 const bigram=z.trainBigram(NAMES);
 const attention=z.selfAttention({tokens:['the','cat','sat']});
 const diagnostics=z.initialisationDiagnostics({gain:2,depth:4});
 const figures:Record<string,string>={
  trace:traceGraphic(trace),
  counts:matrixGraphic(bigram.counts.slice(0,9).map(row=>row.slice(0,9)),{rowLabels:bigram.characters.slice(0,9),caption:'Bigram counts',description:'Counts of each character following another.'}),
  attention:matrixGraphic(attention.weights,{rowLabels:['the','cat','sat'],caption:'Attention weights',description:'Softmax attention weights with future positions masked.',mask:true}),
  wide:matrixGraphic(bigram.counts,{caption:'Full count matrix',description:'Every character pair in the training words.'}),
  scatter:scatterGraphic([[0,0],[1,2],[-1,0.5]],['a','b','c'],'Embeddings'),
  histogram:histogramGraphic(diagnostics.layers[3].histogram,'Activations',diagnostics.layers[3].saturatedFraction),
  series:seriesGraphic([{label:'loss',values:[3,2.4,2.1]},{label:'baseline',values:[2.5,2.5,2.5],comparison:true}],'Training loss',{xLabel:'Step'}),
  logSeries:seriesGraphic([{label:'parameters',values:[8256,16512,33024]}],'Scaling',{logScale:true}),
  tree:treeGraphic(2,4),
  ribbon:tokenRibbonGraphic(['the',' cat',' sat',' on',' the',' mat','\n','    x'],'Tokens'),
  empty:matrixGraphic([],{caption:'No data',description:'Nothing to draw.'}),
  emptySeries:seriesGraphic([{label:'none',values:[]}],'Nothing'),
 };
 for(const [name,svg] of Object.entries(figures)){
  assert.match(svg,/<svg[^>]+role="img"/,name);
  assert.match(svg,/<title>[^<]+<\/title>/,name);
  assert.match(svg,/<desc>[^<]+<\/desc>/,name);
  assert.ok(!svg.includes('NaN')&&!svg.includes('Infinity')&&!svg.includes('undefined'),name);
  assert.match(svg,/<(?:path|rect|circle|polyline) /,name);
  for(const [,x,y] of svg.matchAll(/<text x="([-\d.]+)" y="([-\d.]+)"/g)){
   assert.ok(Number(x)>=0&&Number(x)<=600,`${name}: label x ${x} outside the viewBox`);
   assert.ok(Number(y)>=0&&Number(y)<=280,`${name}: label y ${y} outside the viewBox`);
  }
 }
});

test('the sandbox runs a sample, reports failures, and truncates large values',()=>{
 const ok=runSample('print("hello", 1/3); return [[1,2],[3,4]];');
 assert.equal(ok.ok,true);
 assert.deepEqual(ok.lines,['hello 0.333333']);
 assert.deepEqual(ok.matrix,[[1,2],[3,4]]);
 const usesNumerics=runSample('const m = z2h.trainBigram(data.NAMES); print(m.characters.length); return m.loss;');
 assert.equal(usesNumerics.ok,true);
 assert.equal(usesNumerics.lines[0],String(z.trainBigram(NAMES).characters.length));
 const broken=runSample('nope();');
 assert.equal(broken.ok,false);
 assert.match(broken.error,/nope/);
 const syntax=runSample('const = ;');
 assert.equal(syntax.ok,false);
 assert.match(syntax.error,/SyntaxError/);
 // Long or deep values are truncated so one return cannot lock the page.
 assert.match(runSample('return Array.from({length:100},(_,i)=>i);').returned,/76 more/);
 assert.equal(runSample('return {a:{b:{c:{d:1}}}};').returned,'{ a: { b: { c: {…} } } }');
 // A matrix anywhere in the returned value is offered to the figure.
 assert.deepEqual(runSample('return {weights:[[1,2],[3,4]]};').matrix,[[1,2],[3,4]]);
 assert.equal(runSample('return [[1,2],[3]];').matrix,undefined);
 assert.equal(runSample('return "text";').matrix,undefined);
});

test('every lecture links to real files, real videos, and real course labs',()=>{
 assert.equal(lectures.length,9);
 const labIds=new Set(readFileSync(new URL('../src/site/labs.ts',import.meta.url),'utf8').match(/id: "\d{2}-\d{2}"/g).map(entry=>entry.slice(5,10)));
 const panels=new Set<string>();
 for(const lecture of lectures){
  assert.ok(existsSync(new URL(lecture.guide,new URL('../docs/zero-to-hero/',import.meta.url))),lecture.guide);
  assert.match(lecture.video,/^[\w-]{11}$/,lecture.id);
  assert.ok(lecture.focus.length>60&&lecture.outcome.length>60,lecture.id);
  assert.ok(lecture.courseModules.length>0&&lecture.courseModules.every(entry=>entry.module>=0&&entry.module<=9));
  assert.ok(lecture.labs.length>0);
  for(const lab of lecture.labs)assert.ok(labIds.has(lab),`${lecture.id} references unknown lab ${lab}`);
  assert.ok(lecture.links.every(item=>item.url.startsWith('https://')),lecture.id);
  assert.ok(lecture.sample.code.includes('print(')||lecture.sample.code.includes('return '),lecture.id);
  panels.add(lecture.panel);
 }
 // Each lecture gets its own panel: nine mechanisms, nine interactive figures.
 assert.equal(panels.size,9);
 assert.deepEqual(lectures.map(lecture=>lecture.number),[1,2,3,4,5,6,7,8,9]);
});

test('every lecture sample runs in the sandbox and produces output',()=>{
 for(const lecture of lectures){
  const result=runSample(lecture.sample.code);
  assert.equal(result.ok,true,`${lecture.id}: ${result.error}`);
  assert.ok(result.lines.length>0||result.returned!==undefined,lecture.id);
  assert.ok(!result.lines.join(' ').includes('NaN'),`${lecture.id} printed NaN`);
 }
});

test('every runnable block in the guides executes and prints something',()=>{
 // Inline examples are part of the lesson text, so a broken one is a broken
 // lesson. Each is run exactly as the page runs it.
 let executed=0;
 for(const lecture of lectures){
  const text=guideText(lecture);
  const blocks=liveBlocksOf(text);
  assert.ok(blocks.length>=2,`${lecture.id} carries no inline examples`);
  blocks.forEach((code,index)=>{
   const result=runSample(code);
   assert.equal(result.ok,true,`${lecture.id} block ${index+1}: ${result.error}`);
   assert.ok(result.lines.length>0||result.returned!==undefined,`${lecture.id} block ${index+1} printed nothing`);
   assert.ok(!result.lines.join(' ').includes('NaN'),`${lecture.id} block ${index+1} printed NaN`);
   assert.ok(!result.lines.join(' ').includes('undefined'),`${lecture.id} block ${index+1} printed undefined`);
   executed++;
  });
 }
 assert.ok(executed>=18,`only ${executed} inline examples found`);
});

test('runnable blocks are recognised only when fenced as run',()=>{
 assert.deepEqual(liveBlocksOf('```run\nprint(1)\n```'),['print(1)']);
 assert.deepEqual(liveBlocksOf('```js\nprint(1)\n```'),[]);
 assert.deepEqual(liveBlocksOf('text\n\n```run\na\n```\n\nmore\n\n```run\nb\n```\n'),['a','b']);
});

test('each guide pairs its JavaScript cells with a PyTorch starting point',()=>{
 for(const lecture of lectures){
  const text=guideText(lecture);
  const blocks=pythonBlocks(text);
  assert.equal(blocks.length,1,`${lecture.id} should carry exactly one Python starter`);
  assert.ok(blocks[0].split('\n').length>=10,`${lecture.id}: the starter is too small to start from`);
  assert.ok(text.includes('colab.research.google.com'),`${lecture.id} must point at Colab`);
  // The sandbox executes JavaScript, so a Python block must never be marked
  // runnable: it would fail the moment a learner pressed Run.
  assert.ok(!/```(?:python run|run python)/.test(text),`${lecture.id} marks Python as runnable`);
  assert.equal(liveBlocksOf(text).some(code=>code.includes('import torch')),false,lecture.id);
 }
});

test('every Python starter compiles',{skip:python3Available?false:'python3 is not available here'},()=>{
 for(const lecture of lectures)
  for(const code of pythonBlocks(guideText(lecture)))
   execFileSync('python3',['-c','import sys; compile(sys.stdin.read(), "<starter>", "exec")'],{input:code});
});

// Executing the starters needs PyTorch, which this repository deliberately does
// not depend on, so the check is opt-in: RUN_PYTHON_STARTERS=1 npm test, on a
// machine with torch installed. Each block runs in its own process, because a
// learner pastes one block into a fresh notebook.
test('every Python starter runs standalone under PyTorch',
 {skip:process.env.RUN_PYTHON_STARTERS==='1'?false:'set RUN_PYTHON_STARTERS=1 with torch installed'},()=>{
 for(const lecture of lectures)
  for(const code of pythonBlocks(guideText(lecture)))
   execFileSync('python3',['-c',code],{stdio:'pipe',timeout:300000});
});

test('track notes are included in progress backups',()=>{
 assert.ok(isLearningDataKey('llm-training-zero-to-hero-l1'));
 assert.ok(isLearningDataKey('llm-training-zero-to-hero-l9'));
 assert.ok(!isLearningDataKey('llm-training-zero-to-hero-code-l1'),'scratch code is session-only and must not enter a backup');
 assert.ok(!isLearningDataKey('unrelated-key'));
});

test('the guides teach without reproducing the lectures and point at our own checks',()=>{
 const base=new URL('../docs/zero-to-hero/',import.meta.url);
 for(const lecture of lectures){
  const text=guideText(lecture);
  assert.ok(text.includes(`youtube.com/watch?v=${lecture.video}`),`${lecture.id} must link its video`);
  for(const heading of ['## The mechanism in plain terms','## Implement it yourself','## Checks that must pass','## Use the panel','## Exercises','## Transfer task'])
   assert.ok(text.includes(heading),`${lecture.id} is missing ${heading}`);
  assert.ok(text.split('\n').filter(line=>line.startsWith('```')).length%2===0,`${lecture.id} has an unclosed fence`);
  assert.ok(/Andrej Karpathy/.test(text),`${lecture.id} must credit the author`);
 }
 const licensing=readFileSync(new URL('licensing.md',base),'utf8');
 for(const repository of ['micrograd','makemore','minbpe','nanoGPT','build-nanogpt','nn-zero-to-hero'])
  assert.ok(licensing.includes(repository),`licensing.md must record ${repository}`);
 assert.ok(licensing.includes('No license file found'),'licensing.md must flag the unlicensed repository');
});
