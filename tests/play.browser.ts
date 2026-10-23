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

  // Phone width: no horizontal page scroll.
  const phone = await browser.newPage({ viewport: { width: 375, height: 800 } });
  phone.on("pageerror", (error: Error) => errors.push(error.message));
  for (const url of ["play.html", "play.html?episode=e03", "play.html?episode=e04"]) {
    await phone.goto(`${base}/site/${url}`);
    await phone.waitForSelector(".hud-stat");
    const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 0, `${url} overflows by ${overflow}px`);
  }
  if (shots) await phone.screenshot({ path: `${shots}/arcade-phone.png` });
  assert.deepEqual(errors, []);
  console.log("Arcade browser check passed.");
} finally {
  await browser.close();
}
