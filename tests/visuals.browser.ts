import assert from 'node:assert/strict';
import { submodules } from '../src/site/submodules.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({headless:true});
const page = await browser.newPage();
const errors:string[]=[];
page.on('pageerror',e=>errors.push(e.message));
const base=process.env.LAB_URL || 'http://127.0.0.1:8765';
try {
 const kinds=[...new Set(submodules.map(unit=>unit.visual))];
 for(const kind of kinds){
  const unit=submodules.find(unit=>unit.visual===kind);
  await page.goto(`${base}/site/submodule.html?unit=${unit.id}`);
  const svg=page.locator('#unit-sandbox svg').first();
  await svg.waitFor({state:'attached'});
  assert.ok(await svg.getAttribute('aria-label'),kind);
  const sliders=page.locator('#unit-sandbox input[type="range"]');
  for(const extreme of ['min','max']){
   for(const slider of await sliders.all()){
    await slider.fill(await slider.getAttribute(extreme));
    await slider.dispatchEvent('input');
   }
   assert.ok(!(await page.locator('#unit-sandbox').innerHTML()).includes('NaN'),kind);
  }
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),kind);
 }
 await page.goto(`${base}/site/submodule.html?unit=01-01`);
 await page.locator('#concept-primer svg').first().waitFor();
 await page.screenshot({path:'/tmp/llm-neural-visuals-mobile.png',fullPage:true});
 await page.setViewportSize({width:1280,height:900});
 await page.locator('#unit-sandbox').screenshot({path:'/tmp/llm-neural-sandbox.png'});
 assert.deepEqual(errors,[]);
 console.log(`Visual browser checks passed: ${kinds.length} sandbox kinds, slider extremes, SVG labels, mobile overflow.`);
} finally {await browser.close();}
