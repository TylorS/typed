import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build, preview } from "astro";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("./fixtures/site/", import.meta.url));
await build({ root, logLevel: "error" });
const server = await preview({ root, server: { port: 0, host: "127.0.0.1" }, logLevel: "error" });
const browser = await chromium.launch({ headless: true });
try {
  const url = `http://127.0.0.1:${server.port}/`;
  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(url);
  assert.equal(await staticPage.locator("#summary .summary-count").textContent(), "0");
  assert.equal((await staticPage.locator("#summary .summary-button").textContent()).trim(), "Add");
  assert.match(await staticPage.locator("#summary").innerText(), /Total:\s*0/);
  assert.equal(await staticPage.locator("#load button").textContent(), "1");
  assert.equal(await staticPage.locator("#load strong").textContent(), "Default slot");
  assert.equal(await staticPage.locator("#load h2").textContent(), "Named slot");
  assert.equal(await staticPage.locator("#only").count(), 0);
  assert.equal(await staticPage.locator("#nested-static astro-slot").count(), 0);
  assert.equal(await staticPage.locator("astro-static-slot").count(), 0);
  assert.equal(await staticPage.locator('astro-slot[name="default"]').count(), 0);
  assert.equal(
    await staticPage
      .locator("#load")
      .evaluate(
        (element) =>
          element.closest("astro-island").querySelectorAll("template[data-astro-template]").length,
      ),
    0,
  );

  await staticContext.close();

  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  for (const [directive, initial] of [
    ["load", 1],
    ["idle", 2],
    ["visible", 3],
    ["media", 4],
    ["only", 5],
  ]) {
    const button = page.locator(`#${directive} button`);
    await button.waitFor();
    await page.waitForFunction(
      (id) => !document.querySelector(`#${id}`)?.closest("astro-island")?.hasAttribute("ssr"),
      directive,
    );
    await button.click();
    await page.waitForFunction(
      ({ id, value }) => document.querySelector(`#${id} button`)?.textContent === value,
      { id: directive, value: String(initial + 1) },
    );
  }
  assert.equal(await page.locator("#static button").textContent(), "0");
  assert.equal(await page.locator("#load strong").textContent(), "Default slot");
  assert.equal(await page.locator("#nested-static b").textContent(), "Nested default");
  assert.equal(await page.locator("#nested-static em").textContent(), "Nested heading");
  assert.equal(
    await page.locator("#load > astro-slot[name=heading] > h2").textContent(),
    "Named slot",
  );

  const summary = page.locator("#summary .summary-button");
  await page.waitForFunction(
    () => !document.querySelector("#summary astro-island")?.hasAttribute("ssr"),
  );
  await summary.click();
  await page.waitForFunction(
    () => document.querySelector("#summary .summary-count")?.textContent === "1",
  );
  assert.equal(await page.locator("#summary-static .summary-count").textContent(), "0");
  await page.goto(new URL("component-contract/", url).href);
  assert.equal(await page.locator("#zero").textContent(), "Zero");
  assert.equal(await page.locator("#with-props").textContent(), "Props");
  await page.waitForFunction(() => {
    const island = document.querySelector("#piped-zero astro-island");
    return island !== null && !island.hasAttribute("ssr");
  });
  assert.equal(await page.locator("#piped-zero button").textContent(), "Piped 0");
  await page.locator("#piped-zero button").click();
  await page.waitForFunction(
    () => document.querySelector("#piped-zero button")?.textContent === "Piped 1",
  );
  assert.deepEqual(errors, []);
  console.log(
    "Astro production fixture: SSR, slots, load/idle/visible/media/only hydration passed.",
  );
} finally {
  await browser.close();
  await server.stop();
}
