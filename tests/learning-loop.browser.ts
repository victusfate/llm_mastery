import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true});const page=await browser.newPage();const errors:string[]=[];
page.on('pageerror',e=>errors.push(e.message));
const base=process.env.LAB_URL || 'http://127.0.0.1:8765';
try{
 await page.goto(`${base}/site/`);await page.waitForSelector('#concept-primer .concept-flow');
 assert.ok((await page.locator('#concept-primer summary').first().textContent()).includes('Model'));
 await page.locator('#concept-primer [data-term]').first().click();
 assert.ok(await page.locator('#concept-dialog .concept-figure').isVisible());
 assert.ok(await page.locator('#concept-body a[target="_blank"]').count()>=2);
 await page.locator('#concept-dialog .tutor-panel > summary').click();
 const prompt=page.locator('#concept-dialog [data-prompt]');await page.waitForFunction(()=>document.querySelector<HTMLTextAreaElement>('#concept-dialog [data-prompt]').value.includes('Model'));
 await page.locator('#concept-dialog [data-provider]').selectOption('openrouter');
 assert.equal(await page.locator('#concept-dialog [data-open]').getAttribute('href'),'https://openrouter.ai/chat');
 await page.locator('#concept-close').click();await page.locator('#tab-test').click();await page.locator('#next-question').click();
 await page.locator('#confidence').selectOption('high');await page.locator('#answer').fill('999');await page.locator('#check').click();
 assert.ok((await page.locator('#confidence-feedback').textContent()).includes('assumption'));
 assert.ok((await page.locator('#study-coach').textContent()).includes('Revisit'));
 const record=await page.evaluate(()=>JSON.parse(localStorage.getItem('llm-training-lab-v1')));
 assert.equal(record.history.at(-1).confidence,'high');
 await page.goto(`${base}/site/voices.html`);
 for(const voice of ['af_heart','bm_george','bf_emma']){
  const audio=page.locator(`audio[src$="${voice}.wav"]`);await audio.evaluate(a=>(a as HTMLAudioElement).play());
  await page.waitForFunction(v=>{const a=document.querySelector<HTMLAudioElement>(`audio[src$="${v}.wav"]`);return a.currentTime>0},voice);
  assert.equal(await audio.evaluate(a=>(a as HTMLAudioElement).error),null);
 }
 await page.setViewportSize({width:390,height:844});await page.goto(`${base}/site/submodule.html?unit=01-01`);await page.waitForSelector('#concept-primer .concept-flow');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'/tmp/llm-learning-loop-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('Learning loop browser checks passed: definitions, visuals, references, tutor handoff, confidence, recommendations, Kokoro playback and mobile layout.');
}finally{await browser.close()}
