import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true});const base=process.env.LAB_URL || 'http://127.0.0.1:8765';
const a=await browser.newContext(),b=await browser.newContext();const page=await a.newPage(),other=await b.newPage();
try {
 const guide=base+'/site/read.html?doc=docs/09-home-lab.md';await page.goto(guide);
 await page.selectOption('[data-hardware]','gpu');await page.selectOption('[data-memory]','8to16');await page.selectOption('[data-cloud]','25');await page.reload();
 assert.equal(await page.locator('[data-hardware]').inputValue(),'gpu');assert.ok((await page.locator('[data-plan]').textContent()).includes('$25'));
 await other.goto(guide);assert.equal(await other.locator('[data-hardware]').inputValue(),'browser');
 await page.goto(base+'/site/lab.html?lab=01-01');await page.locator('#lab-notes').fill('Evidence retained across browsers using a backup.');
 await page.goto(base+'/site/');const downloading=page.waitForEvent('download');await page.locator('#export').click();const download=await downloading;const file=await download.path();
 await other.goto(base+'/site/');other.once('dialog',d=>d.accept());await other.locator('#import').setInputFiles(file);await other.waitForFunction(()=>document.querySelector('#storage-status').textContent.includes('Backup imported'));
 await other.goto(guide);assert.equal(await other.locator('[data-hardware]').inputValue(),'gpu');
 await other.goto(base+'/site/lab.html?lab=01-01');await other.waitForSelector('#lab-notes:not([disabled])');assert.ok((await other.locator('#lab-notes').inputValue()).includes('Evidence retained'));
 await other.goto(guide);await other.locator('[data-reset]').click();await other.reload();assert.equal(await other.locator('[data-hardware]').inputValue(),'browser');
 console.log('Persistence browser checks passed: hardware changes, reload, profile isolation, full backup/restore and reset.');
}finally{await browser.close()}
