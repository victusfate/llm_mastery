export const hardwareOptions = {
 browser: 'Browser only', cpu: 'CPU laptop / desktop', apple: 'Apple Silicon Mac', gpu: 'One GPU', multi: 'Multiple GPUs',
};
export interface HardwareProfile { hardware:keyof typeof hardwareOptions; memory:string; cloud:string }
const defaults:HardwareProfile={hardware:'browser',memory:'unknown',cloud:'0'};
const key='llm-mastery-hardware-v1';
export function parseHardwareProfile(value:unknown):HardwareProfile {
 const data=value as Partial<HardwareProfile>;
 return {
  hardware:data && Object.hasOwn(hardwareOptions,data.hardware)?data.hardware:'browser',
  memory:['unknown','under8','8to16','over16'].includes(data?.memory)?data.memory:'unknown',
  cloud:['0','25','100','custom'].includes(data?.cloud)?data.cloud:'0',
 };
}
export function hardwarePlan(profile:HardwareProfile):string[] {
 const plans:Record<HardwareProfile['hardware'],string[]>={
  browser:['Begin with definitions, visual experiments, readings and retrieval checks.','For implementation labs, arrange access to a Python environment; a GPU is not needed for the first examples.'],
  cpu:['Run NumPy, finite-difference checks and tiny training loops on your CPU.','Keep data and models deliberately small; profile before deciding an accelerator is necessary.'],
  apple:['Verify the CPU example first, then test your framework’s supported Apple acceleration backend.','Check a forward and backward pass for the actual operations. Unified memory is shared with the system.'],
  gpu:['Start with one tiny training loop and measure usable accelerator memory and peak training memory.','Increase context, model size or batch size one at a time. Do not infer training capacity from inference alone.'],
  multi:['Use devices for independent seeds or ablations before synchronized training.','Then compare single-device and distributed correctness. Measure communication; GPU memory is not automatically pooled.'],
 };
 const steps=[...plans[profile.hardware]];
 if(profile.hardware==='gpu'||profile.hardware==='multi')steps.push(profile.memory==='unknown'?'Inventory usable memory on each device before selecting experiment sizes.':profile.memory==='under8'?'Prioritize small models and short sequences; measure the complete training state.':profile.memory==='8to16'?'Pilot modest experiments and tune microbatch size from observed peak memory.':'Additional memory permits broader experiments, but multiple model copies and long sequences still need a measured budget.');
 steps.push(profile.cloud==='0'?'Cloud spending ceiling: $0. Continue with local work and CPU-sized contribution tasks.':profile.cloud==='custom'?'Set a concrete cloud ceiling in your own experiment log before renting anything.':'Optional cloud ceiling: $'+profile.cloud+'/month. Price and cap each experiment before launching it.');
 return steps;
}
export function mountHardwareProfile(root:HTMLElement) {
 const section=document.createElement('section');section.className='card';section.setAttribute('aria-label','Your hardware setup');
 section.innerHTML=`<h2>Your setup</h2><p>Choose your resources. This is saved only in this browser, not sent to a server.</p><label>Hardware <select data-hardware>${Object.entries(hardwareOptions).map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select></label><label data-memory-label>Usable memory per GPU <select data-memory><option value="unknown">Not measured yet</option><option value="under8">Under 8 GB</option><option value="8to16">8–16 GB</option><option value="over16">Over 16 GB</option></select></label><label>Monthly cloud ceiling <select data-cloud><option value="0">$0 — local work only</option><option value="25">Up to $25</option><option value="100">Up to $100</option><option value="custom">I will set my own ceiling</option></select></label><h3>Your starting plan</h3><ol data-plan></ol><button data-reset>Clear my setup</button><p data-status role="status"></p>`;
 const hardware=section.querySelector<HTMLSelectElement>('[data-hardware]'),memory=section.querySelector<HTMLSelectElement>('[data-memory]'),cloud=section.querySelector<HTMLSelectElement>('[data-cloud]'),status=section.querySelector<HTMLElement>('[data-status]');
 let profile={...defaults};try{profile=parseHardwareProfile(JSON.parse(localStorage.getItem(key)||'null'));}catch{}
 function render(){
  hardware.value=profile.hardware;memory.value=profile.memory;cloud.value=profile.cloud;
  section.querySelector<HTMLElement>('[data-memory-label]').hidden=!['gpu','multi'].includes(profile.hardware);
  const list=section.querySelector('[data-plan]');list.replaceChildren();
  for(const text of hardwarePlan(profile)){const item=document.createElement('li');item.textContent=text;list.append(item)}
 }
 section.addEventListener('change',()=>{profile=parseHardwareProfile({hardware:hardware.value,memory:memory.value,cloud:cloud.value});render();try{localStorage.setItem(key,JSON.stringify(profile));status.textContent='Saved in this browser.'}catch{status.textContent='Storage unavailable; this plan remains usable for the current page.'}});
 section.querySelector<HTMLButtonElement>('[data-reset]').onclick=()=>{profile={...defaults};render();try{localStorage.removeItem(key);status.textContent='Setup cleared. Choose your hardware to personalize the plan.'}catch{status.textContent='Plan reset; browser storage could not be cleared.'}};
 render();root.prepend(section);
}
