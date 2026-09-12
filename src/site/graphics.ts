import { escapeHTML as esc } from './engine.ts';

// SVG primitives keep diagrams local, sharp at any zoom, and available offline.
export const text = (x:number,y:number,label:string) => `<text x="${x}" y="${y}">${esc(label)}</text>`;
export const line = (x:number,y:number,a:number,b:number,extra='') => `<path d="M${x} ${y} L${a} ${b}" class="wire" ${extra}/>`;
export const node = (x:number,y:number,label='') => `<circle cx="${x}" cy="${y}" r="15" class="neuron"/>${label?text(x,y+5,label):''}`;
export const box = (x:number,y:number,w:number,h:number,label:string) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" class="block"/>${text(x+w/2,y+h/2+5,label)}`;
// Essential presentation travels with the SVG: stale or missing page CSS must
// never turn labels black or remove the network edges.
const graphicStyles:Record<string,string> = {
 wire: 'fill:none;stroke:#a5c9bd;stroke-width:2',
 neuron: 'fill:#214e45;stroke:#c4ed9a;stroke-width:2',
 block: 'fill:#203c33;stroke:#a5c9bd;stroke-width:1.5',
 signal: 'fill:#c4ed9a',
 blocked: 'fill:#0d1915;stroke:#a5c9bd;stroke-width:1.5',
 curve: 'fill:none;stroke:#c4ed9a;stroke-width:3',
 comparison: 'fill:none;stroke:#ffe0a0;stroke-width:3;stroke-dasharray:6 4',
};
export function frame(label:string,body:string,description:string):string {
 const painted=body.replace(/class="(wire|neuron|block|signal|blocked|curve|comparison)"/g,
  (_,kind)=>`class="${kind}" ${graphicStyles[kind].split(';').map(pair=>{const [key,value]=pair.split(':');return `${key}="${value}"`;}).join(' ')}`)
  .replace(/<text /g,'<text fill="#f3f7ee" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" ');
 return `<div class="diagram-scroll" role="region" tabindex="0" aria-label="${esc(label)} — scroll horizontally to explore" style="max-width:100%;overflow-x:auto"><svg class="mechanism-graphic" viewBox="0 0 600 280" role="img" aria-label="${esc(label)}" style="min-width:600px;width:100%;height:auto;max-height:none;background:#0d1915;forced-color-adjust:none"><title>${esc(label)}</title><desc>${esc(description)}</desc>${painted}</svg></div><p class="diagram-description">${esc(description)}</p>`;
}
export function networkGraphic(width=4):string {
 const count=Math.min(width,6), layers=[2,count,2], positions=layers.map((n,i)=>Array.from({length:n},(_,j)=>[90+i*210,50+j*175/Math.max(1,n-1)]));
 let body='';
 for(let i=0;i<2;i++)for(const [x,y] of positions[i])for(const [a,b] of positions[i+1])body+=line(x,y,a,b);
 positions.forEach((layer,i)=>{layer.forEach(([x,y])=>body+=node(x,y));body+=text(90+i*210,265,['2 input features',`${width} hidden neurons`,'2 output scores'][i]);});
 if(width>6)body+=text(300,30,`6 of ${width} neurons shown`);
 return frame('Fully connected neural network',body,'Each edge is a learned weight. Input features connect to hidden neurons, which connect to two output scores. Biases are omitted.');
}
export function barsGraphic(values:number[],labels:string[],caption:string):string {
 const max=Math.max(1,...values.map(Math.abs));
 return frame(caption,values.map((v,i)=>{const x=90+i*420/Math.max(1,values.length-1),height=Math.abs(v)/max*145;return `<rect class="signal" x="${x-26}" y="${205-height}" width="52" height="${height}"/>${text(x,230,labels[i])}${text(x,195-height,v.toFixed(2))}`;}).join('')+line(45,205,555,205)+text(300,265,caption),'Bar heights show magnitudes; labels give signed values. '+labels.map((l,i)=>`${l}: ${values[i].toFixed(3)}`).join(', '));
}
export function attentionGraphic(n=5,query=n-1,causal=true):string {
 let body=text(300,25,'Query → accessible key / value positions');
 for(let i=0;i<n;i++){const x=55+i*490/Math.max(1,n-1);if(!causal||i<=query)body+=line(55+query*490/Math.max(1,n-1),75,x,195);body+=node(x,195,String(i));}
 body+=node(55+query*490/Math.max(1,n-1),75,'q');
 return frame('Attention connections',body+text(300,255,'Connections show permission, not learned weights'),`Query ${query} may access ${causal?query+1:n} of ${n} positions.`);
}
export function gridGraphic(rows:number,cols:number,caption:string,mask=false):string {
 let body=text(300,25,caption);const size=Math.min(30,440/cols,175/rows),x0=300-cols*size/2;
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)body+=`<rect x="${x0+c*size}" y="${50+r*size}" width="${size-3}" height="${size-3}" class="${mask&&c>r?'blocked':'signal'}"/>`;
 return frame(caption,body+text(300,260,mask?'Rows: queries · columns: keys · dark = blocked':`${rows} rows × ${cols} columns`),caption);
}
export function curveGraphic(overfit=false):string {
 const points=Array.from({length:41},(_,i)=>`${60+i*12},${overfit?65+130*(1-Math.exp(-i/9)):210-0.38*(i-20)**2}`).join(' ');
 let body=line(60,35,60,220)+line(60,220,550,220)+`<polyline class="curve" points="${points}"/>`;
 if(overfit)body+=`<path class="comparison" d="M60 65 Q180 240 360 130 T540 50"/>`+text(350,45,'Dashed: held-out loss');
 else body+=node(180,172)+line(195,180,250,203)+node(300,210)+text(300,50,'L(w) = (w − 3)²');
 return frame(overfit?'Training and held-out loss':'Loss landscape',body+text(300,260,overfit?'Training steps → (illustrative curves)':'Parameter w → minimum at w = 3'),overfit?'Training loss decreases while held-out loss eventually rises. Illustrative, not measured results.':'A convex bowl with a parameter moving toward its minimum.');
}
export function corpusGraphic(counts=[1000,900,720]):string {
 let body='';counts.forEach((count,i)=>{const x=45+i*195;for(let j=3;j>=0;j--)body+=box(x+j*5,70-j*5,105,115,'');body+=text(x+60,125,String(Math.round(count)))+text(x+60,220,['Raw documents','Filtered','Deduplicated'][i]);if(i<2)body+=line(x+125,120,x+178,120);});
 return frame('Document curation',body,'Document counts through filtering and deduplication: '+counts.join(', '));
}
export function workersGraphic(workers=3,steps=4):string {
 let body=box(210,25,180,40,'Shared update');for(let i=0;i<workers;i++){const x=35+i*530/workers,w=480/workers;body+=line(x+w/2,115,300,65)+box(x,115,w,65,`GPU ${i+1}`);for(let j=0;j<4;j++)body+=`<circle class="signal" cx="${x+10+j*(w-20)/3}" cy="160" r="4"/>`;}
 return frame('Parallel minibatches',body+text(300,230,`4 sequences / worker × ${steps} accumulation steps`)+text(300,260,`${workers*4*steps} sequences per update`),'Each worker processes local data; gradients contribute to one shared update.');
}
export function maskGraphic(response=5,padding=3):string {
 const groups=[20,response,padding],total=groups.reduce((a,b)=>a+b,0);let body=text(300,30,'Sequence positions →');let offset=0;
 groups.forEach((n,g)=>{for(let j=0;j<n;j++)body+=`<rect x="${35+(offset+j)*530/total}" y="85" width="${Math.max(1,530/total-2)}" height="65" class="${g===1?'signal':'blocked'}"/>`;offset+=n;});
 return frame('Supervised token mask',body+text(300,195,`Prompt: 20 · response: ${response} · padding: ${padding}`)+text(300,240,'Bright tokens contribute to the training loss'),'Only response positions contribute to assistant-only supervised loss. Attention masking is separate.');
}
export function policyGraphic(p=.7):string {
 return frame('Policy action branches',box(30,95,115,55,'Context')+line(145,122,265,122)+node(280,122,'π')+line(293,115,440,65,`style="stroke-width:${2+6*p}"`)+line(293,130,440,195,`style="stroke-width:${2+6*(1-p)}"`)+box(440,40,125,50,'A: reward 3')+box(440,170,125,50,'B: reward 1')+text(355,55,`${(100*p).toFixed(0)}%`)+text(355,215,`${(100*(1-p)).toFixed(0)}%`)+text(300,265,'Policy probabilities → action → feedback'),`Action A probability ${p.toFixed(2)}, reward 3; action B probability ${(1-p).toFixed(2)}, reward 1. Toy policy, not experiment results.`);
}
export function computationGraphic():string {
 return frame('Forward and backward computation graph',node(55,85,'w')+node(55,185,'x')+line(68,85,170,135)+line(68,185,170,135)+node(185,135,'×')+line(198,135,295,135)+box(295,110,90,50,'y²')+line(385,135,465,135)+node(480,135,'L')+text(300,35,'Forward: y = w × x, L = y²')+`<path class="comparison" d="M480 175 Q300 285 70 220"/>`+text(300,260,'Backward: ∂L/∂w = 2yx'),'Two scalar inputs multiply, then square to give the loss. The backward path carries derivatives to the weight.');
}
export function transformerGraphic():string {
 return frame('Decoder transformer pathway',gridBody()+box(150,90,115,65,'Attention')+line(115,122,150,122)+line(265,122,310,122)+box(310,90,125,65,'Feed-forward')+line(435,122,480,122)+box(480,90,95,65,'Logits')+`<path class="comparison" d="M130 122 V55 H285 V122 M290 122 V195 H455 V122"/>`+text(300,245,'Dashed paths: residual additions · norms omitted'),'Token embeddings pass through attention and feed-forward blocks with residual connections, then a vocabulary projection. Normalization and repeated blocks omitted.');
}
function gridBody():string {return [0,1,2].map(i=>box(20,70+i*38,95,30,['the','cat','sat'][i])).join('');}

export function descentGraphic(rate:number):string {
 let w=2;const values=[w];for(let i=0;i<18;i++){w*=1-rate;values.push(w);}
 const bound=Math.max(2,...values.map(Math.abs));
 const points=values.map((v,i)=>[55+i*27,125-v/bound*80]);
 return frame('Gradient descent parameter trajectory',line(55,35,55,215)+line(55,125,560,125)+`<polyline class="curve" points="${points.map(p=>p.join(',')).join(' ')}"/>`+points.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3" class="signal"/>`).join('')+text(300,25,'L(w) = w²/2 · w ← (1 − rate)w')+text(300,245,`Steps 0 → 18 · vertical range ±${bound.toFixed(2)}`)+text(300,270,`Learning rate ${rate.toFixed(2)} · final w = ${w.toFixed(4)}`),'Each dot is one update of a single parameter. The vertical axis rescales to include divergence.');
}
export function tokenGraphic():string {
 return frame('Text to token embeddings',text(300,30,'Text → token IDs → learned vectors')+['the','cat','sat'].map((t,i)=>box(45,65+i*60,100,40,t)+line(145,85+i*60,225,85+i*60)+node(245,85+i*60,String(i+7))+line(258,85+i*60,325,85+i*60)+Array.from({length:6},(_,j)=>`<rect x="${330+j*33}" y="${65+i*60}" width="28" height="40" class="signal" opacity="${.55+((i+j)%4)*.15}"/>`).join('')).join('')+text(300,270,'Illustrative word tokens and IDs; real tokenizers vary'),'Three word tokens map to integer IDs and rows of a learned embedding table. Shading represents illustrative feature values.');
}
export function evaluationGraphic():string {
 let body=text(300,25,'Held-out outcomes: 60 correct / 100 total');
 for(let i=0;i<100;i++)body+=`<circle cx="${120+i%20*19}" cy="${65+Math.floor(i/20)*28}" r="7" class="${i<60?'signal':'blocked'}"/>`;
 return frame('Evaluation outcomes',body+text(300,245,'Each dot is one example · illustrative outcomes'),'60 bright dots are correct and 40 dark dots are failures. These are hypothetical outcomes, not course experiment results.');
}
export function stateGraphic(sharded=false):string {
 let body=text(300,25,sharded?'Model state split across workers':'Each worker holds a full model');
 for(let i=0;i<3;i++){body+=box(30+i*195,65,150,140,`GPU ${i+1}`);for(let j=0;j<6;j++)body+=`<rect x="${45+i*195+j%3*40}" y="${155+Math.floor(j/3)*18}" width="33" height="12" class="${!sharded||Math.floor(j/2)===i?'signal':'blocked'}"/>`;}
 return frame('Distributed model state',body+text(300,255,sharded?'Filled tiles: locally owned state shards':'Filled tiles: replicated parameter state'),sharded?'Different workers own different parts of model state. Communication is required for computation.':'Workers replicate model state and process different local data.');
}
export function loraGraphic():string {
 return frame('Low-rank weight adaptation',box(35,55,160,160,'W (frozen)')+text(225,140,'+')+box(260,55,45,160,'B')+text(330,140,'×')+box(355,110,160,45,'A')+text(300,260,'Train narrow factors: ΔW = scaled BA'),'A tall narrow B matrix multiplies a short wide A matrix to form a low-rank update to frozen W.');
}

export function scalingGraphic():string {
 const points=Array.from({length:30},(_,i)=>`${65+i*16},${65+130*(1-Math.exp(-i/10))}`).join(' ');
 return frame('Empirical scaling trend',line(55,35,55,220)+line(55,220,550,220)+`<polyline class="curve" points="${points}"/>`+text(300,25,'Loss decreases with scale in this illustrative fit')+text(300,260,'Model / data scale → · extrapolation requires validation'),'An illustrative decreasing loss curve against increasing scale; not a fitted result or a performance guarantee.');
}
export function timelineGraphic():string {
 return frame('Workload timeline',text(300,25,'Elapsed time →')+text(65,90,'CPU')+box(120,65,95,35,'Load')+text(65,145,'GPU')+box(215,120,190,35,'Compute')+text(65,200,'Network')+box(405,175,135,35,'Sync')+line(120,230,540,230)+text(300,265,'Illustrative trace · measure before optimizing'),'Data loading precedes GPU computation and gradient synchronization in this simplified serial trace. Durations are illustrative.');
}
export function intervalGraphic():string {
 let body=text(300,25,'Estimates and uncertainty ranges (illustrative)');
 [[.4,.6,.5],[.55,.85,.7],[.35,.75,.55]].forEach(([lo,hi,mid],i)=>{const y=75+i*55;body+=text(70,y+5,`Run ${i+1}`)+line(120+lo*400,y,120+hi*400,y)+line(120+lo*400,y-8,120+lo*400,y+8)+line(120+hi*400,y-8,120+hi*400,y+8)+node(120+mid*400,y);});
 return frame('Uncertainty intervals',body+text(300,265,'Metric value → · dot: estimate · whiskers: interval'),'Three example estimates have intervals of different widths. Interval validity depends on sampling and statistical assumptions.');
}
