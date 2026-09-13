import assert from 'node:assert/strict';
import { lectures } from '../src/site/z2h-track.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.LAB_URL || 'http://127.0.0.1:8765';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors: string[] = [];
page.on('pageerror', e => errors.push(e.message));
// Resource-level console errors carry no URL, and external media cannot load in
// a sandboxed environment, so failed loads are judged by same-origin responses.
page.on('console', message => {
 if (message.type() === 'error' && !/Failed to load resource/.test(message.text())) errors.push(message.text());
});
page.on('response', response => {
 if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
});
// Every runnable block on a page becomes a .live-cell: the ones beside the
// explanations, then the lecture's full sample at the end.
async function runCell(index: number): Promise<string> {
 const cell = page.locator('.live-cell').nth(index);
 await cell.locator('button.primary').click();
 await page.waitForFunction(
  (n) => document.querySelectorAll('.live-cell')[n]?.querySelector('.live-output')?.textContent.length > 0,
  index, { timeout: 20000 });
 assert.match(await cell.locator('[role="status"]').textContent(), /Finished in \d+ ms/, `cell ${index}`);
 return cell.locator('.live-output').textContent();
}

try {
 for (const lecture of lectures) {
  await page.goto(`${base}/site/zero-to-hero.html?lecture=${lecture.id}`);
  // The study guide is fetched Markdown: a heading proves it rendered.
  await page.locator('#guide-body h2').first().waitFor();
  assert.equal(await page.locator('#lecture-title').textContent(), lecture.title);
  assert.equal(await page.locator('#lecture-navigation a[aria-current="page"]').count(), 1, lecture.id);
  assert.ok((await page.locator('#lecture-links a').count()) >= 2, lecture.id);
  // The panel computes its own figures; every figure must be labelled.
  const figure = page.locator('#lecture-widget svg').first();
  await figure.waitFor({ state: 'attached' });
  assert.ok(await figure.getAttribute('aria-label'), lecture.id);
  const sliders = page.locator('#lecture-widget input[type="range"]');
  for (const extreme of ['min', 'max']) {
   for (const slider of await sliders.all()) {
    await slider.fill(await slider.getAttribute(extreme));
    await slider.dispatchEvent('input');
   }
   const run = page.locator('#lecture-widget button.primary');
   if (await run.count()) await run.click();
   const panel = await page.locator('#lecture-widget').innerHTML();
   assert.ok(!panel.includes('NaN'), `${lecture.id} produced NaN at ${extreme}`);
   assert.ok(!panel.includes('could not be computed'), `${lecture.id} failed at ${extreme}`);
  }
  // Labs named by the track must resolve to real lab pages.
  assert.equal(await page.locator('#lecture-mapping .lab-link').count(), lecture.labs.length, lecture.id);
  // Inline examples from the guide plus the lecture's full sample.
  const cells = await page.locator('.live-cell').count();
  assert.ok(cells >= 3, `${lecture.id}: expected inline cells plus a sample, found ${cells}`);
  for (const index of [0, cells - 1]) {
   const output = await runCell(index);
   assert.ok(output.length > 5, `${lecture.id} cell ${index}: empty output`);
   assert.ok(!/^(?:\w*Error|SyntaxError)/.test(output.trim()), `${lecture.id} cell ${index}: ${output.slice(0, 200)}`);
   assert.ok(!output.includes('NaN'), `${lecture.id} cell ${index} printed NaN`);
  }
  // Editing one cell must not disturb another on the same page.
  await page.locator('.live-cell textarea').first().fill('print("edited");');
  assert.ok(!(await page.locator('.live-cell textarea').nth(cells - 1).inputValue()).includes('edited'), lecture.id);
 }

 // A runaway snippet must cost a terminated worker, not a frozen page.
 await page.goto(`${base}/site/zero-to-hero.html?lecture=l1`);
 await page.locator('#guide-body h2').first().waitFor();
 const sample = page.locator('.live-cell').last();
 await sample.locator('textarea').fill('while (true) {}');
 await sample.locator('button.primary').click();
 await page.waitForFunction(() => /Stopped after/.test(document.querySelector('.live-cell:last-of-type .live-output')?.textContent ?? ''), null, { timeout: 20000 });
 assert.ok(await sample.locator('button.primary').isEnabled(), 'the run button must recover after a timeout');
 await sample.locator('button').nth(1).click();
 assert.equal(await sample.locator('textarea').inputValue(), lectures[0].sample.code);

 // A returned matrix is drawn, so editing code changes a picture.
 await sample.locator('textarea').fill('return [[1,2],[3,4]];');
 await sample.locator('button.primary').click();
 await sample.locator('svg').waitFor();

 // An inline cell keeps an edit across a reload within the session.
 const inline = page.locator('.live-cell').first();
 await inline.locator('textarea').fill('print("my own experiment", 6 * 7);');
 await inline.locator('button.primary').click();
 await page.waitForFunction(() => /42/.test(document.querySelector('.live-cell .live-output')?.textContent ?? ''));
 await page.reload();
 await page.locator('#guide-body h2').first().waitFor();
 assert.match(await page.locator('.live-cell textarea').first().inputValue(), /my own experiment/);

 // Notes persist like every other course note.
 await page.locator('#lecture-notes').fill('My prediction was wrong about saturation.');
 await page.locator('#lecture-save').click();
 assert.match(await page.locator('#track-status').textContent(), /Saved/);
 await page.reload();
 await page.locator('#guide-body h2').first().waitFor();
 assert.equal(await page.locator('#lecture-notes').inputValue(), 'My prediction was wrong about saturation.');

 // The opt-in embed is only created when a learner asks for it.
 assert.equal(await page.locator('#lecture-video iframe').count(), 0);
 await page.locator('#lecture-open button').click();
 assert.equal(await page.locator('#lecture-video iframe').count(), 1);
 assert.match(await page.locator('#lecture-video iframe').getAttribute('src'), /^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{11}$/);
 assert.equal(await page.locator('#lecture-video a[rel="noopener"]').count(), 1, 'a blocked embed must still offer a direct link');

 // An unknown lecture falls back to the first rather than failing.
 await page.goto(`${base}/site/zero-to-hero.html?lecture=../secret`);
 assert.equal(await page.locator('#lecture-title').textContent(), lectures[0].title);

 await page.setViewportSize({ width: 390, height: 844 });
 await page.goto(`${base}/site/zero-to-hero.html?lecture=l7`);
 await page.locator('#lecture-widget svg').first().waitFor({ state: 'attached' });
 assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile overflow');
 await page.screenshot({ path: '/tmp/llm-zero-to-hero-mobile.png', fullPage: true });
 await page.setViewportSize({ width: 1280, height: 900 });
 await page.locator('#lecture-widget').screenshot({ path: '/tmp/llm-zero-to-hero-panel.png' });

 assert.deepEqual(errors, []);
 console.log(`Zero to Hero browser checks passed: ${lectures.length} lecture pages, slider extremes, inline and sample cells, timeout recovery, notes, mobile layout.`);
} finally { await browser.close(); }
