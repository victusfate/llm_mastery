import assert from 'node:assert/strict';
import { labs } from '../src/site/labs.ts';
import { submodules } from '../src/site/submodules.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
const base=process.env.LAB_URL || 'http://127.0.0.1:8765';
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto(`${base}/docs/06-resources.md`);
 await page.waitForSelector('#guide-body table th');
 assert.ok(page.url().includes('read.html?doc='));
 assert.equal(await page.locator('#guide-body table th').count(),3);
 await page.locator('#guide-body .concept-term').first().click();
 assert.ok(await page.locator('#concept-dialog').isVisible());
 assert.ok((await page.locator('#concept-body').textContent()).length>100);
 await page.locator('#concept-close').click();
 assert.equal(await page.locator('#reader-video-choices button').count(),2);
 await page.locator('#reader-video-choices button').first().click();
 assert.ok((await page.locator('#reader-video iframe').getAttribute('src')).includes('youtube-nocookie.com'));
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'/tmp/llm-reader-mobile.png',fullPage:true});
 await page.goto(`${base}/site/submodule.html?unit=01-01`);
 await page.waitForSelector('#guide-body h1');
 await page.locator('#unit-audio').evaluate(a=>a.play());
 await page.waitForFunction(()=>document.querySelector('#unit-audio').currentTime>0);
 assert.equal(await page.locator('#unit-audio').evaluate(a=>a.error),null);
 for(const item of [...labs,...submodules]) {
  const url=new URL(item.file,`${base}/site/`);
  assert.equal((await page.request.get(url.href)).status(),200,url.href);
 }
 await page.goto(`${base}/site/lab.html?lab=01-01`);
 await page.waitForSelector('#guide-body h1');
 assert.ok((await page.locator('#guide-body').textContent()).length>1000);
 assert.deepEqual(errors,[]);
 console.log('Reader/browser passed: Markdown redirect, tables, concepts, embedded video, mobile layout, audio playback, 87 linked documents, lab page.');
} finally {await browser.close();}
