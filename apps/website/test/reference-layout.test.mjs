import assert from "node:assert/strict";
import { test } from "node:test";
import { preview } from "astro";
import { chromium } from "playwright";

test("reference names wrap and the selected module is visible without scrolling the page", async (t) => {
  const server = process.env.SITE_ORIGIN ? undefined : await preview({
    root: new URL("../", import.meta.url).pathname,
    server: { host: "127.0.0.1", port: 0 }, logLevel: "silent",
  });
  if (server) t.after(() => server.stop());
  const origin = process.env.SITE_ORIGIN ?? (server ? `http://127.0.0.1:${server.port}` : undefined);
  assert.ok(origin);
  const base = (process.env.SITE_BASE ?? "/typed/").replace(/\/$/u, "");
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage();
  for (const width of [320, 360, 390, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    for (const route of [
      "/reference/modules/@typed/template/Renderable/",
      "/reference/modules/@typed/ui/WindowSplitter/",
      "/reference/symbols/QHR5cGVkL3VpL2luZGV4I1dpbmRvd1NwbGl0dGVyLldpbmRvd1NwbGl0dGVyT3B0aW9ucw/",
    ]) {
      await page.goto(`${origin}${base}${route}`, { waitUntil: "load" });
      const state = await page.evaluate(() => {
        const sidebar = document.querySelector(".docs-sidebar");
        const active = sidebar?.querySelector('[aria-current="page"]');
        const bounds = active?.getBoundingClientRect();
        return {
          width: document.documentElement.scrollWidth,
          main: document.getElementById("main-content")?.tagName,
          pageY: scrollY,
          visible: !sidebar?.clientHeight || !bounds ||
            (bounds.height > 0 && bounds.top >= 0 && bounds.bottom <= innerHeight),
        };
      });
      assert.ok(state.width <= width + 1, `${route} overflows ${width}px (document: ${state.width}px)`);
      assert.equal(state.main, "MAIN");
      assert.equal(state.pageY, 0, "revealing a module must not move the document");
      assert.ok(state.visible, `${route} selected module is outside the viewport`);
    }
  }
});
