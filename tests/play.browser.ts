// Optional browser check for the arcade. Install Playwright separately or set PLAYWRIGHT_MODULE.
import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.LAB_URL || "http://127.0.0.1:8765";
const shots = process.env.SCREENSHOT_DIR;
const browser = await chromium.launch({ headless: true });
const errors: string[] = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  page.on("pageerror", (error: Error) => errors.push(error.message));
  await page.goto(`${base}/site/play.html`);
  await page.waitForSelector(".episode-tile");
  assert.equal(await page.locator(".episode-tile").count(), 20);
  if (shots) await page.screenshot({ path: `${shots}/arcade-map.png`, fullPage: true });

  // Play: the challenge starts unsolved, the sweep animates without solving it, a real move does.
  await page.locator("#continue").click();
  assert.equal(await page.locator("#to-idea").isDisabled(), true);
  await page.locator("#watch").click();
  await page.waitForFunction(() => !(document.querySelector("#watch") as HTMLButtonElement).disabled, null, { timeout: 10000 });
  assert.equal(await page.locator("#to-idea").isDisabled(), true, "watching must not solve the challenge");
  const before = await page.locator(".sbar-fill").first().getAttribute("style");
  await page.locator('[data-control="p"]').fill("0.9");
  assert.notEqual(await page.locator(".sbar-fill").first().getAttribute("style"), before, "scene updates in place");
  assert.match(await page.locator("#challenge-status").textContent(), /Solved/);
  if (shots) await page.screenshot({ path: `${shots}/arcade-challenge.png` });
  await page.locator("#to-idea").click();

  // Idea, then a choice: a wrong pick costs first-try credit, here we answer right.
  assert.ok((await page.locator(".idea").textContent()).length < 180);
  await page.locator("#to-check").click();
  await page.locator('[data-choice="1"]').click();
  await page.locator("#to-number").click();

  // Calculate: e01 asks for ln(n) with randomized n.
  const prompt = await page.locator(".question").textContent();
  const n = Number(prompt.match(/For (\d+) equally/)[1]);
  await page.locator("#number-answer").fill(Math.log(n).toFixed(4));
  await page.locator("#number-form button").click();
  await page.locator("#to-reward").click();
  await page.waitForSelector(".big-star.lit");
  assert.equal(await page.locator(".big-star.lit").count(), 3);
  await page.waitForTimeout(1500);
  if (shots) await page.screenshot({ path: `${shots}/arcade-reward.png` });

  // Persistence: arcade record, shared review schedule, and the banked module step.
  const stored = await page.evaluate(() => ({
    game: JSON.parse(localStorage.getItem("llm-training-arcade-v1")),
    main: JSON.parse(localStorage.getItem("llm-training-lab-v1")),
  }));
  assert.equal(stored.game.episodes.e01.best, 90);
  assert.ok(stored.game.badges.includes("perfect"));
  assert.equal(stored.main.reviews["0-0"].correct, 1);

  // Replays never inflate XP.
  await page.locator("#to-map").click();
  assert.match(await page.locator("#hud").textContent(), /90 XP/);
  await page.reload();
  assert.equal(await page.locator(".episode-tile.played").count(), 1);

  // Every episode's challenge renders and the deep link opens it.
  for (let i = 1; i <= 20; i++) {
    const id = `e${String(i).padStart(2, "0")}`;
    await page.goto(`${base}/site/play.html?episode=${id}`);
    await page.waitForSelector("#stage .scene");
    assert.ok(await page.locator("#stage [data-control]").count() > 0, id);
    assert.ok((await page.locator(".scene-readouts .metric").count()) > 0, id);
  }

  // Rabbit holes stay contextual, interactive, and separate from scored actions.
  await page.goto(`${base}/site/play.html?episode=e01`);
  await page.waitForSelector('#learning-guide');
  const guide = page.locator('#learning-guide');
  await guide.locator('.learning-terms summary').first().click();
  assert.match(await guide.locator('.learning-terms details').first().textContent(), /between 0 and 1/);
  await guide.locator('[data-flow="2"]').click();
  assert.match(await guide.locator('#flow-detail').textContent(), /1.609/);
  await page.locator('[data-control="p"]').fill('0.4');
  assert.match(await guide.locator('#flow-detail').textContent(), /0.916/);
  await guide.locator('[data-twist]').click();
  assert.equal(await page.locator('[data-control="p"]').inputValue(), '0.01');
  assert.match(await guide.locator('[data-live-result]').textContent(), /4.605/);
  assert.match(await guide.locator('[data-twist-notice]').textContent(), /penalty collapses/);
  assert.equal(await page.locator('#to-idea').isDisabled(), true, 'guided demos award no challenge XP');
  if (shots) await guide.screenshot({ path: `${shots}/arcade-learning.png` });
  await guide.locator('[data-reset-twist]').click();
  assert.equal(await page.locator('[data-control="p"]').inputValue(), '0.2');
  await guide.locator('[data-episode-tutor] summary').click();
  await page.waitForFunction(() => !!(document.querySelector('#learning-guide [data-prompt]') as HTMLTextAreaElement).value);
  const tutorPrompt = await guide.locator('[data-prompt]').inputValue();
  assert.match(tutorPrompt, /Surprise, measured/);
  assert.match(tutorPrompt, /"p":0.2/);
  assert.match(tutorPrompt, /Current exercise/);
  await guide.locator('.episode-primer > summary').click();
  await guide.locator('.definition-card').first().waitFor();
  await guide.locator('[data-term]').first().click();
  await page.waitForFunction(() => (document.querySelector('#concept-dialog') as HTMLDialogElement).open);
  assert.ok((await page.locator('#concept-body').textContent()).length > 50);
  await page.locator('#concept-close').click();
  assert.equal(await page.locator('[data-control="p"]').inputValue(), '0.2', 'exploration preserves settings');
  await page.locator('#skip-challenge').click();
  await page.locator('#to-check').click();
  await guide.locator('[data-copy]').click();
  assert.match(await guide.locator('[data-prompt]').inputValue(), /The model gives the right token/);

  // Every authored twist is available and produces immediate feedback.
  for (let i = 1; i <= 20; i++) {
    await page.goto(`${base}/site/play.html?episode=e${String(i).padStart(2, '0')}`);
    await page.locator('[data-twist]').click();
    assert.ok((await page.locator('[data-twist-notice]').textContent()).length > 40);
    assert.equal(await page.locator('#to-idea').isDisabled(), true);
    assert.equal(await page.locator('[data-flow="2"]').getAttribute('aria-pressed'), 'true');
  }

  // Phone width: no horizontal page scroll.
  const phone = await browser.newPage({ viewport: { width: 375, height: 800 } });
  phone.on("pageerror", (error: Error) => errors.push(error.message));
  for (const url of ["play.html", "play.html?episode=e03", "play.html?episode=e04"]) {
    await phone.goto(`${base}/site/${url}`);
    await phone.waitForSelector(".hud-stat");
    const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 0, `${url} overflows by ${overflow}px`);
    if (url.includes('episode=')) {
      await phone.locator('[data-twist]').click();
      await phone.locator('[data-episode-tutor] summary').click();
      assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${url} expanded help overflows`);
    }
  }
  if (shots) await phone.screenshot({ path: `${shots}/arcade-phone.png` });
  assert.deepEqual(errors, []);
  console.log("Arcade browser check passed.");
} finally {
  await browser.close();
}
