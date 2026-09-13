import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { conceptVisual, visualSteps } from '../src/site/concept-visuals.ts';
import { networkGraphic, workersGraphic, maskGraphic, attentionGraphic, descentGraphic } from '../src/site/graphics.ts';
import { traceGraphic, matrixGraphic, scatterGraphic, histogramGraphic, seriesGraphic, treeGraphic, tokenRibbonGraphic } from '../src/site/z2h-visuals.ts';
import * as z from '../src/site/z2h-numerics.ts';
import { NAMES, TOKENIZER_SAMPLE, ATTENTION_SENTENCE } from '../src/site/z2h-data.ts';
const { chromium }=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch();
const page=await browser.newPage();
const css=await readFile('site/style.css','utf8');
const examples=Object.keys(visualSteps).map(title=>({title,html:conceptVisual(title)}));
examples.push({title:'Control extremes',html:networkGraphic(32)+workersGraphic(8,16)+maskGraphic(20,20)+attentionGraphic(8,7,false)+descentGraphic(2.5)});
// Zero to Hero figures meet the same bar as the concept visuals.
const trace=z.backpropagate(z.parseExpression('(a*b + c) * tanh(a) + exp(b)'),{a:1.5,b:-2,c:0.5});
const bigram=z.trainBigram(NAMES);
const tokenizer=z.trainBPE(TOKENIZER_SAMPLE,32);
const probe=z.encodeBPE(tokenizer,'the tokenizer sees 1234 and    indentation');
const attention=z.selfAttention({tokens:ATTENTION_SENTENCE});
const diagnostics=z.initialisationDiagnostics({gain:3,depth:8});
examples.push({title:'Zero to Hero figures',html:
 traceGraphic(trace)+
 matrixGraphic(attention.weights,{rowLabels:ATTENTION_SENTENCE,caption:'Attention weights',description:'Softmax attention weights with future positions masked.',mask:true})+
 matrixGraphic(bigram.counts,{caption:'Every character pair',description:'Counts for the full vocabulary without labels.'})+
 matrixGraphic(bigram.counts.slice(0,9).map(row=>row.slice(0,9)),{rowLabels:bigram.characters.slice(0,9),caption:'Bigram counts',description:'Counts of each character following another.'})+
 scatterGraphic(bigram.characters.map((_,i)=>[Math.sin(i),Math.cos(i*1.7)]),bigram.characters,'Learned embeddings')+
 histogramGraphic(diagnostics.layers[7].histogram,'Activations in layer 8',diagnostics.layers[7].saturatedFraction)+
 seriesGraphic([{label:'activation std',values:diagnostics.layers.map(l=>l.activationStd)},{label:'gradient std',values:diagnostics.layers.map(l=>l.gradientStd),comparison:true}],'Per-layer statistics',{logScale:true,xLabel:'Layer index'})+
 seriesGraphic([{label:'learning rate',values:z.learningRateSchedule({steps:120,warmup:15})}],'Warmup then cosine decay',{xLabel:'Optimizer step'})+
 treeGraphic(2,6)+
 tokenRibbonGraphic(z.tokenPieces(tokenizer,probe),'Token boundaries')});
const artifact='/tmp/llm-visual-design';await mkdir(artifact,{recursive:true});
function contrast(a:number[],b:number[]) {
 const luminance=(rgb:number[])=>rgb.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
 const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
let minText=Infinity,minGraphic=Infinity;const failures:string[]=[];
try {
 for(const width of [1280,390,320]) {
  await page.setViewportSize({width,height:900});
  await page.setContent(`<style>${css}</style><main style="max-width:1000px;margin:auto">${examples.map(e=>`<section data-example="${e.title}"><h2>${e.title}</h2>${e.html}</section>`).join('')}</main>`);
  const result=await page.evaluate(()=>{
   const rgb=(value:string)=>value.match(/[\d.]+/g)?.map(Number)||[];
   const issues:string[]=[];const texts:any[]=[],shapes:any[]=[];
   for(const svg of document.querySelectorAll<SVGSVGElement>('svg')){
    const title=svg.closest('[data-example]').getAttribute('data-example');
    const bg=rgb(getComputedStyle(svg).backgroundColor);
    const bounds=svg.viewBox.baseVal;
    const geometry=[...svg.querySelectorAll<SVGGeometryElement>('rect,circle,path,polyline')];
    for(const label of svg.querySelectorAll<SVGTextElement>('text')) {
     if(!label.textContent.trim())continue;
     const box=label.getBBox(),style=getComputedStyle(label);
     if(box.x<0||box.y<0||box.x+box.width>bounds.width||box.y+box.height>bounds.height)issues.push(`${title}: clipped label ${label.textContent}`);
     const size=parseFloat(style.fontSize)*svg.getBoundingClientRect().width/bounds.width;
     if(size<15.9)issues.push(`${title}: font rendered at ${size}`);
     const p=new DOMPoint(box.x+box.width/2,box.y+box.height/2);
     const behind=geometry.filter(shape=>!!(shape.compareDocumentPosition(label)&Node.DOCUMENT_POSITION_FOLLOWING)&&getComputedStyle(shape).fill!=='none'&&shape.isPointInFill(p)).at(-1);
     texts.push({title,text:label.textContent,fg:rgb(style.fill),bg:behind?rgb(getComputedStyle(behind).fill):bg});
    }
    for(const shape of geometry){
     const style=getComputedStyle(shape),alpha=Number(style.opacity),isFill=style.stroke==='none';
     const color=rgb(isFill?style.fill:style.stroke);
     // State tiles can sit inside worker blocks; evaluate against that fill too.
     const b=shape.getBBox(),p=new DOMPoint(b.x+b.width/2,b.y+b.height/2);
     const parent=geometry.filter(other=>other!==shape&&other.classList.contains('block')&&!!(other.compareDocumentPosition(shape)&Node.DOCUMENT_POSITION_FOLLOWING)&&other.isPointInFill(p)).at(-1);
     const background=parent?rgb(getComputedStyle(parent).fill):bg;
     if(color.length>=3)shapes.push({title,kind:shape.getAttribute('class'),fg:color.map((c,i)=>c*alpha+background[i]*(1-alpha)),bg:background});
    }
   }
   if(document.documentElement.scrollWidth>innerWidth)issues.push('Page overflow');
   return {issues,texts,shapes};
  });
  failures.push(...result.issues);
  for(const item of result.texts){const ratio=contrast(item.fg,item.bg);minText=Math.min(minText,ratio);if(ratio<4.5)failures.push(`${item.title}: text ${item.text} contrast ${ratio}`);}
  for(const item of result.shapes){const ratio=contrast(item.fg,item.bg);minGraphic=Math.min(minGraphic,ratio);if(ratio<3)failures.push(`${item.title}: ${item.kind} contrast ${ratio}`);}
  if(width===390)await page.locator('section').first().screenshot({path:`${artifact}/mobile.png`});
 }
 // Missing page styles reproduce the failure mode in the reported screenshot.
 await page.setContent(examples.map(e=>e.html).join(''));
 const fallback=await page.locator('svg').evaluateAll(svgs=>svgs.every(svg=>[...svg.querySelectorAll('text')].every(t=>getComputedStyle(t).fill==='rgb(243, 247, 238)')&&[...svg.querySelectorAll('.wire')].every(e=>getComputedStyle(e).stroke!=='none')));
 assert.ok(fallback,'Essential SVG styles survive a missing stylesheet');
 // Review sheets include every distinct mechanism, at its readable native size.
 await page.setViewportSize({width:1280,height:900});
 await page.setContent(`<style>${css}</style><div id="sheets" style="display:grid;grid-template-columns:600px 600px;gap:20px;padding:20px"></div>`);
 const unique=new Map<string,string>();
 for(const example of examples){
  const matches=example.html.match(/<svg[\s\S]*?<\/svg>/g)||[];
  for(const svg of matches)unique.set(svg.match(/<title>(.*?)<\/title>/)[1],svg);
 }
 const plates=[...unique.entries()];
 for(let i=0;i<plates.length;i+=6){
  await page.locator('#sheets').evaluate((root,plates)=>{root.innerHTML=plates.map(([title,svg])=>`<section><h2>${title}</h2>${svg}</section>`).join('')},plates.slice(i,i+6));
  await page.locator('#sheets').screenshot({path:`${artifact}/sheet-${i/6+1}.png`});
 }
 await writeFile(`${artifact}/results.json`,JSON.stringify({concepts:71,widths:[1280,390,320],minText,minGraphic,failures},null,2));
 assert.deepEqual([...new Set(failures)],[]);
 console.log(`Visual design: 71 concepts + extremes at 1280/390/320px; minimum text ${minText.toFixed(2)}:1, graphics ${minGraphic.toFixed(2)}:1; missing-CSS fallback passed.`);
} finally {await browser.close();}
