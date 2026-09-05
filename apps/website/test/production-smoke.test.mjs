import assert from "node:assert/strict";
import { preview } from "astro";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const base = (process.env.SITE_BASE ?? "/typed-smol/").replace(/\/$/u, "");

test(
  "the GitHub Pages build renders, hydrates, searches, and respects theme and mobile boundaries",
  { timeout: 90000 },
  async (t) => {
    const server = await preview({
      root,
      server: { host: "127.0.0.1", port: 0 },
      logLevel: "silent",
    });
    t.after(() => server.stop());
    const origin = `http://127.0.0.1:${server.port}`;
    const browser = await chromium.launch();
    t.after(() => browser.close());
    const context = await browser.newContext({
      colorScheme: "dark",
      viewport: { width: 1440, height: 950 },
    });
    const page = await context.newPage();
    /** @type {string[]} */
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${origin}${base}/`);
    assert.match(await page.title(), /Typed/);
    const logo = page.locator(".brand-animated .typewriter");
    assert.match(
      await logo.evaluate((node) => getComputedStyle(node, "::after").animationName),
      /logo-typing/,
    );
    assert.equal(await page.locator("footer .brand .typewriter").count(), 0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await logo.evaluate((node) => getComputedStyle(node, "::after").animationName),
      "none",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.waitForFunction(() =>
      [...document.querySelectorAll("astro-island")].every((island) => !island.hasAttribute("ssr")),
    );
    assert.deepEqual(
      await page.locator('.release-demo input[type="checkbox"]').evaluateAll((inputs) =>
        inputs.map((input) => {
          if (!(input instanceof HTMLInputElement)) throw new Error("Expected checklist input");
          return input.checked;
        }),
      ),
      [true, false, false],
    );
    await page.getByLabel("Connect the interface").check();
    await page.waitForFunction(() =>
      document.querySelector(".release-demo output")?.textContent?.includes("2 / 3"),
    );
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await page.waitForFunction(() =>
      document.querySelector(".release-demo output")?.textContent?.includes("1 / 3"),
    );
    // Shiki emits light colors inline and dark colors as custom properties.
    // Both must survive the site's theme styles and switching back again.
    for (const theme of ["matrix-light", "matrix", "matrix-light", "matrix"]) {
      await page.evaluate((theme) => { document.documentElement.dataset.theme = theme; }, theme);
      const highlights = await page.locator(".astro-code span[style]").evaluateAll((tokens, theme) =>
        tokens.flatMap((token) => {
          if (!(token instanceof HTMLElement)) return [];
          const color = theme === "matrix"
            ? token.style.getPropertyValue("--shiki-dark")
            : token.style.color;
          if (!color) return [];
          const expected = document.createElement("span");
          expected.style.color = color;
          return [{ actual: getComputedStyle(token).color, expected: expected.style.color }];
        }), theme);
      assert(highlights.length > 0, `${theme}: highlighted tokens exist`);
      assert(new Set(highlights.map(({ actual }) => actual)).size > 2, `${theme}: distinct syntax colors`);
      assert(highlights.every(({ actual, expected }) => actual === expected), `${theme}: token colors match Shiki`);
    }
    await page.getByRole("button", { name: "Switch color theme" }).click();
    await page.waitForFunction(() => document.documentElement.dataset.theme === "matrix-light");
    assert.equal(await page.locator("html").getAttribute("data-theme"), "matrix-light");
    await page.reload();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "matrix-light");
    await page.getByRole("button", { name: /Search docs/ }).click();
    await page.getByRole("dialog").waitFor({ state: "visible" });
    assert.ok(await page.getByRole("dialog", { name: /Search/ }).isVisible());
    await page.getByRole("searchbox").fill("RefSubject");
    await page.getByRole("dialog").getByRole("link").first().waitFor();
    const result = await page.getByRole("dialog").getByRole("link").first().getAttribute("href");
    assert.ok(result);
    assert.ok(result.startsWith(`${base}/`));
    assert.equal((await fetch(`${origin}${result}`)).status, 200);
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => {
      const input = document.querySelector("#docs-search-query");
      return input instanceof HTMLInputElement && input.value === "";
    });
    assert.equal(await page.getByRole("searchbox").inputValue(), "");
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    for (const route of [
      "explore/quick-start/",
      "explore/tutorial/model-the-domain/",
      "explore/application-developers/",
      "explore/library-developers/",
      "integrate/astro/",
      "reference/modules/@typed/fx/Fx/",
      "reference/packages/@typed/astro/",
      "glossary/",
    ]) {
      const response = await page.goto(`${origin}${base}/${route}`);
      assert.ok(response, "navigation returns an HTTP response");
      assert.equal(response.status(), 200, route);
      assert.equal(await page.locator("main .page-title").count(), 1, route);
      assert.ok((await page.locator("#main-content").innerText()).length > 100, route);
    }
    await page.goto(`${origin}${base}/explore/tutorial/`);
    await page.getByPlaceholder("What needs to be done?").fill("Verify the built tutorial");
    await page.getByPlaceholder("What needs to be done?").press("Enter");
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".todo-list .view label")].some(
        (label) => label.textContent === "Verify the built tutorial",
      ),
    );
    for (const [route, id, initial, increase] of [
      ["quick-start", "counter-reactive", "0", "+"],
      ["counter/component-lifetime", "counter-component", "0", "Increase"],
      ["counter/hydrate-state", "counter-hydrated", "7", "Increase"],
    ]) {
      const response = await page.goto(`${origin}${base}/explore/${route}/`);
      assert.ok(response, "navigation returns an HTTP response");
      assert.equal(response.status(), 200, route);
      assert.equal(await page.locator("[data-demo]").count(), 1, `${route}: one focused example`);
      const demo = page.locator(`[data-demo="${id}"]`);
      await demo.scrollIntoViewIfNeeded();
      await page.waitForFunction(
        (id) =>
          !document
            .querySelector(`[data-demo="${id}"]`)
            ?.closest("astro-island")
            ?.hasAttribute("ssr"),
        id,
      );
      assert.equal(await demo.locator("output").textContent(), initial);
      const code = await page.locator("article pre code").allTextContents();
      assert.ok(
        code.some(
          (source) =>
            source.includes(`>${increase}</button>`) || source.includes(`\n        ${increase}\n`),
        ),
        `${id}: displayed source must contain the live button label`,
      );
      if (route === "quick-start") {
        assert.ok(
          code.every(
            (source) =>
              !source.includes("RefSubject.hydrate") && !source.includes("renderToHtmlString"),
          ),
          "Quick Start contains only the first working counter",
        );
        assert.equal(
          await page.locator("#server-html > a").first().getAttribute("href"),
          `${base}/explore/counter/server-html/`,
        );
      }
      await demo.getByRole("button", { name: increase, exact: true }).click();
      await page.waitForFunction(
        ({ id, expected }) =>
          document.querySelector(`[data-demo="${id}"] output`)?.textContent === expected,
        { id, expected: String(Number(initial) + 1) },
      );
    }
    for (const scheme of /** @type {const} */ (["dark", "light"])) {
      const mobile = await browser.newPage({
        viewport: { width: 390, height: 844 },
        colorScheme: scheme,
      });
      mobile.on("pageerror", (error) => errors.push(error.message));
      for (const route of [
        "",
        "explore/application-developers/",
        "reference/modules/@typed/template/",
      ]) {
        await mobile.goto(`${origin}${base}/${route}`);
        assert.equal(
          await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
          `${scheme} ${route} must not overflow`,
        );
      }
      assert.equal(
        await mobile.locator("html").getAttribute("data-theme"),
        scheme === "dark" ? "matrix" : "matrix-light",
      );
      await mobile.close();
    }
    assert.equal((await fetch(`${origin}${base}/this-page-does-not-exist/`)).status, 404);
    for (const artifact of [
      "llms.txt",
      "llms-full.txt",
      "docs-manifest.json",
      "sitemap.xml",
      ".well-known/ard.json",
      "index.md",
      "explore/quick-start.md",
    ])
      assert.equal((await fetch(`${origin}${base}/${artifact}`)).status, 200, artifact);
    assert.deepEqual(errors, []);
  },
);
