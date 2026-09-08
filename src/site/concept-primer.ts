import { parseConcepts, type Concept } from './concepts.ts';
import { conceptVisual } from './concept-visuals.ts';
import { deeperResources } from './deeper-resources.ts';
import { escapeHTML as esc } from './engine.ts';
export function definition(concept:Concept):string {
 return concept.body.split('### What it means\n')[1]?.split('\n### ')[0].trim() || concept.title;
}
export function resourcesHTML(module:string):string {
 return `<h3>Go deeper</h3><ul>${deeperResources(module).map(r=>`<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)} ↗</a><p>${esc(r.purpose)}</p></li>`).join('')}</ul>`;
}
let guide:Promise<Concept[]>;
export async function mountPrimer(root:HTMLElement,module:string) {
 if(!root)return;
 root.dataset.module=module;
 guide ||= fetch(new URL('../docs/12-concepts.md',location.href)).then(r=>{if(!r.ok)throw Error('Definitions unavailable');return r.text()}).then(parseConcepts);
 try {
  const all=await guide;
  if(root.dataset.module!==module)return;
  let concepts=all.filter(c=>c.module===module);
  if(module==='01-foundations') {
   const first=['Model','Parameter','Prediction','Loss','Gradient','Training loop'];
   concepts=[...first.map(title=>all.find(c=>c.title===title)),...concepts.filter(c=>!first.includes(c.title))];
  }
  root.innerHTML=`<h2>Definitions & visual examples</h2><p>Start with the meaning. Open an example, then explore the lesson at your pace.</p>${concepts.map((c,i)=>`<details class="definition-card" ${i===0?'open':''}><summary>${esc(c.title)}</summary><p>${esc(definition(c))}</p>${conceptVisual(c.title)}<button data-term="${esc(c.title)}">Explore ${esc(c.title)}</button></details>`).join('')}${resourcesHTML(module)}`;
 }catch{root.textContent='Definitions could not load. Refresh or open the concept guide in the reading library.'}
}
