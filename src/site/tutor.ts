export const tutorDestinations:Record<string,string> = {
 chatgpt:'https://chatgpt.com/',
 claude:'https://claude.ai/new',
 openrouter:'https://openrouter.ai/chat',
 local:'http://localhost:3000/',
};
export function tutorPrompt(title:string,context:string):string {
 return `Help me understand ${title}.\n\nCourse context:\n${context.slice(0,10000)}\n\nStart with a plain definition and a concrete visual example. Ask what I already understand. Let me choose how deeply to explore. Ask one prediction or explanation question at a time, wait for my answer, and adapt. Give hints before solutions. After practice, test a new example without hints and ask my confidence before revealing feedback. Distinguish assisted practice, unaided recall, and practical evidence. Cite relevant primary sources and say when uncertain. Do not claim that passing one question proves mastery.`;
}
export function safeTutorURL(value:string):string {
 const url=new URL(value);
 if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error('Use an HTTP or HTTPS interface URL without credentials.');
 return url.href;
}
export function mountTutor(root:HTMLElement,context:()=>{title:string;text:string}) {
 const panel=document.createElement('details');panel.className='card tutor-panel';
 panel.innerHTML=`<summary>Discuss with my tutor</summary><p>Prepare the contextual prompt, open your preferred app, and paste it. Choose how deeply to explore.</p><label>Preferred interface <select data-provider><option value="chatgpt">ChatGPT</option><option value="claude">Claude</option><option value="openrouter">OpenRouter</option><option value="local">Local / other chat interface</option></select></label><label data-local-label>Local or other interface URL <input data-interface type="url" value="http://localhost:3000/"></label><button data-copy>Prepare & copy prompt</button> <a data-open target="_blank" rel="noopener" href="https://chatgpt.com/">Open my tutor ↗</a><label>Prompt to discuss<textarea data-prompt rows="5"></textarea></label><p data-status role="status"></p><a href="read.html?doc=docs/16-tutor-interfaces.md">Tutor setup and free-model options</a>`;
 const select=panel.querySelector<HTMLSelectElement>('[data-provider]');
 const address=panel.querySelector<HTMLInputElement>('[data-interface]');
 const prompt=panel.querySelector<HTMLTextAreaElement>('[data-prompt]');
 const status=panel.querySelector<HTMLElement>('[data-status]');
 const link=panel.querySelector<HTMLAnchorElement>('[data-open]');
 try {
  const saved=JSON.parse(localStorage.getItem('llm-tutor-settings')||'{}');
  if(tutorDestinations[saved.provider])select.value=saved.provider;
  if(saved.address)address.value=safeTutorURL(saved.address);
 }catch{}
 function settings(){
  panel.querySelector<HTMLElement>('[data-local-label]').hidden=select.value!=='local';
  try {
   link.href=safeTutorURL(select.value==='local'?address.value:tutorDestinations[select.value]);
   localStorage.setItem('llm-tutor-settings',JSON.stringify({provider:select.value,address:address.value}));
   status.textContent='';
  }catch(error){link.removeAttribute('href');status.textContent=String(error)}
 }
 select.onchange=settings;address.onchange=settings;settings();
 function prepare(){const c=context();prompt.value=tutorPrompt(c.title,c.text);}
 panel.addEventListener('toggle',()=>{if(panel.open)prepare()});
 panel.querySelector<HTMLButtonElement>('[data-copy]').onclick=async()=>{
  prepare();
  try{await navigator.clipboard.writeText(prompt.value);status.textContent='Copied. Open your tutor and paste the prompt.'}
  catch{prompt.focus();prompt.select();status.textContent='Copy the selected prompt above, then paste it in your tutor.'}
  document.dispatchEvent(new CustomEvent('conceptlookup',{detail:{query:context().title}}));
 };
 root.append(panel);
}
