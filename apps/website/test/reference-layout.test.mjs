import assert from "node:assert/strict";
import { test } from "node:test";
import { preview } from "astro";
import { chromium } from "playwright";

test("reference navigation works at mobile and desktop widths without overflowing", async (t) => {
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
      "/reference/packages/@typed/react/",
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
      assert.ok((await page.locator(".reference-summary").innerText()).trim(), `${route} has no summary`);

      const mobileNavigation = page.locator(".reference-layout > .mobile-nav");
      if (width < 900) {
        const toggle = mobileNavigation.locator("summary").first();
        assert.ok(await toggle.isVisible(), `${route} has no mobile navigation`);
        await toggle.focus();
        await page.keyboard.press("Enter");
        assert.ok(await mobileNavigation.evaluate((element) => element instanceof HTMLDetailsElement && element.open));
        assert.equal(
          await mobileNavigation.locator("a").count(),
          await page.locator(".reference-layout > .docs-sidebar a").count(),
          "mobile navigation must retain every desktop link",
        );
        const sectionLink = mobileNavigation.locator('a[href^="#"]').first();
        const destination = await sectionLink.getAttribute("href");
        assert.ok(destination);
        await sectionLink.focus();
        await page.keyboard.press("Enter");
        assert.equal(new URL(page.url()).hash, destination);
        assert.equal(await page.locator(destination).count(), 1, "section links need one target");
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          `${route} expanded navigation overflows ${width}px`,
        );
      } else {
        assert.equal(await mobileNavigation.isVisible(), false);
      }
    }
  }
});
