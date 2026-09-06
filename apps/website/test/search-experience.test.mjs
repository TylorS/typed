import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { preview } from "astro";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const base = (process.env.SITE_BASE ?? "/typed/").replace(/\/$/u, "");

test(
  "search consolidates related destinations and supports keyboard and mobile browsing",
  { timeout: 120000 },
  async (t) => {
    const server = process.env.SEARCH_TEST_ORIGIN
      ? undefined
      : await preview({
          root,
          server: { host: "127.0.0.1", port: 0 },
          logLevel: "silent",
        });
    if (server) t.after(() => server.stop());
    const origin = process.env.SEARCH_TEST_ORIGIN ?? (server ? `http://127.0.0.1:${server.port}` : undefined);
    assert.ok(origin);
    const browser = await chromium.launch();
    t.after(() => browser.close());
    /** @type {string[]} */
    const errors = [];
    /** @param {import("playwright").BrowserContextOptions} options */
    const openPage = async (options) => {
      const page = await browser.newPage(options);
      page.on("pageerror", (error) => errors.push(error.message));
      // Source-only validation can supply a freshly generated index without
      // changing shared artifacts. Production runs always use the built route.
      if (process.env.SEARCH_TEST_INDEX) {
        const index = await readFile(process.env.SEARCH_TEST_INDEX, "utf8");
        await page.route("**/search-index.json", (route) =>
          route.fulfill({ contentType: "application/json", body: index }),
        );
      }
      await page.goto(`${origin}${base}/`);
      await page.waitForFunction(
        () =>
          !document.querySelector(".search-trigger")?.closest("astro-island")?.hasAttribute("ssr"),
      );
      return page;
    };
    const page = await openPage({ viewport: { width: 1440, height: 950 }, colorScheme: "dark" });
    const trigger = page.getByRole("button", { name: /Search docs/ });
    const dialog = page.getByRole("dialog", { name: "Search documentation" });
    const input = page.getByRole("searchbox", { name: "Search docs" });
    await trigger.click();
    await dialog.waitFor({ state: "visible" });
    assert.equal(await input.evaluate((element) => element === document.activeElement), true);
    await input.fill("RefSubject");
    await page.locator(".search-result-link").first().waitFor();
    assert.equal(
      await page
        .locator(".search-result-heading strong")
        .getByText("RefSubject", { exact: true })
        .count(),
      1,
    );
    const topic = page.locator(".search-result").first();
    assert.equal(await topic.locator("strong").innerText(), "RefSubject");
    assert.equal(await topic.locator(".search-result-meta").innerText(), "@typed/fx/RefSubject");
    assert.deepEqual(await topic.locator(".search-related a").allTextContents(), [
      "Definition",
      "API reference",
      "Import from @typed/fx",
    ]);
    assert.ok(
      (await page.locator(".search-kind").allTextContents()).slice(1, 4).includes("Learn"),
      "topic guides should precede incidental module members",
    );
    for (const href of await topic
      .locator("a")
      .evaluateAll((links) => links.map((link) => {
        if (!(link instanceof HTMLAnchorElement)) throw new Error("Expected result anchor");
        return link.href;
      }))) {
      assert.equal((await fetch(href)).status, 200, href);
    }
    await page.keyboard.press("ArrowDown");
    assert.equal(
      await topic
        .locator(".search-result-link")
        .evaluate((element) => element === document.activeElement),
      true,
    );
    await page.keyboard.press("ArrowDown");
    assert.equal(
      await topic
        .getByRole("link", { name: "Definition", exact: true })
        .evaluate((element) => element === document.activeElement),
      true,
    );
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    assert.equal(await input.evaluate((element) => element === document.activeElement), true);
    await page.keyboard.press("Shift+Tab");
    assert.equal(
      await dialog.evaluate(
        (element) =>
          element.matches(":modal") &&
          (!document.hasFocus() || element.contains(document.activeElement)),
      ),
      true,
      "Tab may reach browser chrome, but never the inert page behind the native modal",
    );
    await input.click();
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => {
      const input = document.querySelector("#docs-search-query");
      return input instanceof HTMLInputElement && input.value === "";
    });
    assert.equal(await input.inputValue(), "");
    assert.equal(await dialog.isVisible(), true);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.equal(
      await trigger.evaluate((element) => element === document.activeElement),
      true,
      "closing returns focus to the opener",
    );
    await page.keyboard.press("Control+k");
    await dialog.waitFor({ state: "visible" });
    assert.equal(await input.evaluate((element) => element === document.activeElement), true);
    await input.fill("RefSubjct");
    await page
      .waitForFunction(
        () => document.querySelector(".search-result-heading strong")?.textContent === "RefSubject",
      )
      .catch(async (error) => {
        error.message += `\nRendered search: ${await dialog.innerText()}\nErrors: ${errors.join("; ")}`;
        throw error;
      });
    await page.keyboard.press("Enter");
    await page.waitForURL(`**${base}/reference/modules/@typed/fx/RefSubject/`);
    assert.equal(await page.getByRole("dialog").isVisible(), false);
    await page.close();

    for (const colorScheme of /** @type {const} */ (["dark", "light"])) {
      const mobile = await openPage({
        viewport: { width: 390, height: 844 },
        colorScheme,
        isMobile: true,
        hasTouch: true,
      });
      await mobile.getByRole("button", { name: /Search docs/ }).click();
      await mobile.getByRole("searchbox").fill("RefSubject");
      await mobile.locator(".search-result-link").first().waitFor();
      assert.equal(
        await mobile.locator("html").getAttribute("data-theme"),
        colorScheme === "dark" ? "matrix" : "matrix-light",
      );
      assert.equal(
        await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      );
      assert.equal(
        await mobile.getByRole("dialog").evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return (
            rect.left >= 0 &&
            rect.right <= innerWidth &&
            rect.top >= 0 &&
            rect.bottom <= innerHeight &&
            element.scrollWidth <= element.clientWidth
          );
        }),
        true,
        "dialog and its contents fit the mobile viewport",
      );
      const headerBounds = await mobile.locator(".search-dialog-header").boundingBox();
      assert.ok(headerBounds);
      assert.ok(
        headerBounds.height < 80,
        "search chrome leaves room for results",
      );
      const resultBounds = await mobile.locator(".search-result").nth(1).boundingBox();
      assert.ok(resultBounds);
      assert.ok(
        resultBounds.height < 115,
        "ordinary matches stay compact",
      );
      await mobile.getByRole("searchbox").fill("map");
      await mobile.waitForFunction(
        () => document.querySelector(".search-result-heading strong")?.textContent === "map",
      );
      const scopes = await mobile
        .locator(".search-result")
        .evaluateAll((rows) =>
          rows
            .filter((row) => row.querySelector("strong")?.textContent === "map")
            .map((row) => row.querySelector(".search-result-meta")?.textContent),
        );
      assert.ok(scopes.length >= 2, "unrelated map APIs remain visible");
      assert.equal(
        new Set(scopes).size,
        scopes.length,
        "re-export aliases do not occupy duplicate rows",
      );
      await mobile.getByRole("button", { name: "Close search" }).click();
      await mobile.getByRole("dialog").waitFor({ state: "hidden" });
      await mobile.close();
    }
    assert.deepEqual(errors, []);
  },
);
