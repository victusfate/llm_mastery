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
  // The sample runs in a worker and reports something back.
  await page.locator('#sample-run').click();
  await page.waitForFunction(() => document.querySelector('#sample-output').textContent.length > 0);
  const output = await page.locator('#sample-output').textContent();
  assert.ok(output.length > 5, `${lecture.id}: empty sample output`);
  assert.ok(!/^(?:\w*Error|SyntaxError)/.test(output.trim()), `${lecture.id}: ${output.slice(0, 200)}`);
  assert.match(await page.locator('#sample-status').textContent(), /Finished in \d+ ms/, lecture.id);
 }

 // A runaway snippet must cost a terminated worker, not a frozen page.
 await page.goto(`${base}/site/zero-to-hero.html?lecture=l1`);
 await page.locator('#sample-code').fill('while (true) {}');
 await page.locator('#sample-run').click();
 await page.waitForFunction(() => /Stopped after/.test(document.querySelector('#sample-output').textContent), null, { timeout: 15000 });
 assert.ok(await page.locator('#sample-run').isEnabled(), 'the run button must recover after a timeout');
 await page.locator('#sample-reset').click();
 assert.equal(await page.locator('#sample-code').inputValue(), lectures[0].sample.code);

 // A returned matrix is drawn, so editing code changes a picture.
 await page.locator('#sample-code').fill('return [[1,2],[3,4]];');
 await page.locator('#sample-run').click();
 await page.locator('#sample-figure svg').waitFor();

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
 console.log(`Zero to Hero browser checks passed: ${lectures.length} lecture pages, slider extremes, worker samples, timeout recovery, notes, mobile layout.`);
} finally { await browser.close(); }
