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
  const contrastIssues=await page.locator('#unit-sandbox').evaluate(root=>{
   const rgb=(value:string)=>value.match(/[\d.]+/g)?.map(Number)||[];
   const lum=(rgb:number[])=>rgb.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
   const issues:string[]=[];
   for(const el of root.querySelectorAll('label,output,.cell,.metric strong,.metric span,.bar-row span,.diagram-description,button')){
    const style=getComputedStyle(el);let parent:Element=el,bg:number[]=[];
    while(parent){bg=rgb(getComputedStyle(parent).backgroundColor);if(bg.length===3||bg[3]===1)break;parent=parent.parentElement;}
    const a=lum(rgb(style.color)),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    if(ratio<4.5)issues.push(`${el.textContent}: ${ratio}`);
   }
   return issues;
  });
  assert.deepEqual(contrastIssues,[],kind);
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),kind);
 }
 await page.goto(`${base}/site/submodule.html?unit=01-01`);
 await page.locator('#concept-primer svg').first().waitFor();
 const scroll=page.locator('#concept-primer .diagram-scroll').first();
 await scroll.focus();await page.keyboard.press('ArrowRight');
 await page.waitForFunction(()=>document.querySelector('#concept-primer .diagram-scroll').scrollLeft>0);
 await page.locator('#concept-primer [data-term]').first().click();
 assert.ok(await page.locator('#concept-dialog svg').first().isVisible());
 assert.ok(await page.locator('#concept-dialog .diagram-description').first().isVisible());
 await page.locator('#concept-close').click();
 await page.screenshot({path:'/tmp/llm-neural-visuals-mobile.png',fullPage:true});
 await page.setViewportSize({width:1280,height:900});
 await page.locator('#unit-sandbox').screenshot({path:'/tmp/llm-neural-sandbox.png'});
 assert.deepEqual(errors,[]);
 console.log(`Visual browser checks passed: ${kinds.length} sandbox kinds, slider extremes, SVG labels, mobile overflow.`);
} finally {await browser.close();}
