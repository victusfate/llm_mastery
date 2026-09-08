// Optional browser check. Install Playwright separately or set PLAYWRIGHT_MODULE.
import assert from "node:assert/strict";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const base = process.env.LAB_URL || "http://127.0.0.1:8765";
try {
  await page.goto(`${base}/site/`);
  await page.waitForSelector("#modules button");
  assert.equal(await page.locator("#modules button").count(), 10);
  for (let i = 0; i < 10; i++) {
    await page.locator("#modules button").nth(i).click();
    await page.waitForFunction(() => document.querySelector("#guide-body h1"));
    assert.ok(
      (await page.locator("#guide-body").textContent()).includes("Gate"),
    );
  }
  await page.locator("#modules button").nth(0).click();
  await page.locator(".sandbox-details summary").click();
  for (const kind of ["softmax", "attention", "descent", "bandit"]) {
    await page.selectOption("#visual-choice", kind);
    await page
      .locator("#slider")
      .fill(kind === "attention" ? "7" : kind === "descent" ? "2.5" : "0.5");
    await page.locator("#slider").dispatchEvent("input");
    assert.ok(
      (await page.locator("#visual-explanation").textContent()).length > 30,
    );
  }
  await page.selectOption("#visual-choice", "attention");
  await page.locator("#causal").uncheck();
  assert.equal(await page.locator(".cell.on").count(), 64);
  await page.locator("#causal").check();
  assert.equal(await page.locator(".cell.on").count(), 36);
  await page.locator("#tab-test").click();
  await page.locator("#answer").fill("999");
  await page.locator("#check").click();
  assert.ok(
    (await page.locator("#feedback").textContent()).includes("Not yet"),
  );
  await page.locator("#next-question").click();
  await page.locator("#reveal").click();
  const feedback = await page.locator("#feedback").textContent();
  const expected = feedback.match(/Expected ([-\d.]+)\./)[1];
  await page.locator("#answer").fill(expected);
  await page.locator("#check").click();
  assert.ok(
    (await page.locator("#feedback").textContent()).includes("Correct."),
  );
  await page.locator("#tab-build").click();
  await page
    .locator("#notes")
    .fill(
      "Browser smoke: prediction, evidence, and an unreviewed explanation.",
    );
  await page.reload();
  await page.locator("#tab-build").click();
  assert.ok(
    (await page.locator("#notes").inputValue()).includes("Browser smoke"),
  );
  const stored = await page.evaluate(() =>
    localStorage.getItem("llm-training-lab-v1"),
  );
  assert.equal(JSON.parse(stored).history.length, 2);
  const download = page.waitForEvent("download");
  await page.locator("#export").click();
  assert.equal(
    (await download).suggestedFilename(),
    "training-lab-progress.json",
  );
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator("#import")
    .setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(stored),
    });
  await page.waitForFunction(() =>
    document
      .querySelector("#storage-status")
      .textContent.includes("Backup imported"),
  );
  await page
    .locator("#import")
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"version":999}'),
    });
  await page.waitForFunction(() =>
    document
      .querySelector("#storage-status")
      .textContent.includes("Import failed"),
  );
  await page.locator("#review").click();
  assert.equal(await page.locator("#test").isVisible(), true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#tab-learn").click();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.locator("#modules button").nth(0).click();
  await page.screenshot({
    path: "/tmp/llm-training-lab-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({
    path: "/tmp/llm-training-lab-desktop.png",
    fullPage: true,
  });
  const privateResponse = await page.request.get(`${base}/.git/config`);
  assert.equal(privateResponse.status(), 404);
  assert.deepEqual(errors, []);
  console.log(
    "Browser smoke passed: 10 guides, 4 visuals, scoring, persistence, exports/imports, review queue, mobile overflow, private-path rejection.",
  );
} finally {
  await browser.close();
}
