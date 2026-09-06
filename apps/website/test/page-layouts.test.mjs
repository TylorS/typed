import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { preview } from "astro";
import { chromium } from "playwright";
import { test } from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const base = (process.env.SITE_BASE ?? "/typed/").replace(/\/$/u, "");
const site = join(root, "dist/site");

/** @param {string} directory */
async function pagesUnder(directory) {
  const files = await readdir(directory, { recursive: true, withFileTypes: true });
  return (
    files
      .filter((file) => file.isFile() && file.name === "index.html")
      .map((file) =>
        join(file.parentPath, file.name)
          .slice(site.length)
          .replace(/index\.html$/u, ""),
      )
      // The embedded Storybook has its own document and interaction checks.
      .filter((route) => !route.startsWith("/storybook/"))
  );
}

test(
  "every built page renders with readable layout, working navigation, and both color themes",
  { timeout: 900_000 },
  async (t) => {
    const routes = await pagesUnder(site);
    const server = await preview({
      root,
      server: { host: "127.0.0.1", port: 0 },
      logLevel: "silent",
    });
    t.after(() => server.stop());
    const browser = await chromium.launch();
    t.after(() => browser.close());
    const origin = `http://127.0.0.1:${server.port}`;
    /** @type {string[]} */
    const failures = [];
    let visited = 0;

    for (const [scheme, width] of /** @type {const} */ ([
      ["dark", 1440],
      ["light", 390],
    ])) {
      let cursor = 0;
      await Promise.all(
        Array.from({ length: 4 }, async () => {
          const context = await browser.newContext({
            colorScheme: scheme,
            viewport: { width, height: 950 },
          });
          const page = await context.newPage();
          page.on("pageerror", (error) => failures.push(`${page.url()}: ${error.message}`));
          while (cursor < routes.length) {
            const route = routes[cursor++];
            const response = await page.goto(`${origin}${base}${route}`, { waitUntil: "load" });
            if (response?.status() !== 200) failures.push(`${route}: HTTP ${response?.status()}`);
            const layout = await page.evaluate(() => {
              const main = document.querySelector("#main-content");
              const active = document.querySelector('.docs-sidebar [aria-current="page"]');
              const sidebar = document.querySelector(".docs-sidebar");
              const bounds = active?.getBoundingClientRect();
              const frame = sidebar?.getBoundingClientRect();
              return {
                title: document.title,
                text: main?.textContent?.trim().length ?? 0,
                theme: document.documentElement.dataset.theme,
                overflow: document.documentElement.scrollWidth > innerWidth + 1,
                unresolvedSource: [...document.querySelectorAll("pre code")].some((code) =>
                  code.textContent?.includes("// @source examples/"),
                ),
                hiddenCurrent:
                  sidebar && sidebar.clientHeight > 0 && bounds && frame
                    ? bounds.top < Math.max(frame.top, 0) - 1 ||
                      bounds.bottom > Math.min(frame.bottom, innerHeight) + 1
                    : false,
              };
            });
            for (const [condition, message] of [
              [!layout.title.includes("Typed"), "missing page title"],
              [layout.text < 20, "empty main content"],
              [layout.theme !== (scheme === "dark" ? "matrix" : "matrix-light"), "wrong theme"],
              [layout.overflow, `page overflows ${width}px viewport`],
              [layout.unresolvedSource, "unexpanded source reference"],
              [layout.hiddenCurrent, "selected article is outside sidebar viewport"],
            ])
              if (condition) failures.push(`${scheme} ${route}: ${message}`);
            visited++;
            if (visited % 500 === 0)
              console.log(`Inspected ${visited} rendered page/theme combinations`);
          }
          await context.close();
        }),
      );
    }
    assert.deepEqual(failures, []);
    console.log(
      `Inspected all ${routes.length} static pages in dark desktop and light mobile layouts`,
    );
  },
);
