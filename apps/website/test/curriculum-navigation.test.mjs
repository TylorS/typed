import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { preview } from "astro";
import { chromium } from "playwright";

test("article continuation follows the actual sidebar curriculum", async (t) => {
  const server = process.env.SITE_ORIGIN
    ? undefined
    : await preview({
        root: fileURLToPath(new URL("../", import.meta.url)),
        server: { host: "127.0.0.1", port: 0 },
        logLevel: "silent",
      });
  if (server) t.after(() => server.stop());
  const origin =
    process.env.SITE_ORIGIN ?? (server && `http://127.0.0.1:${server.port}`);
  assert.ok(origin, "a site origin or preview server is required");
  const base = (process.env.SITE_BASE ?? "/typed/").replace(/\/$/u, "");
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage({
    viewport: { width: 1440, height: 950 },
  });
  for (const route of [
    "/explore/cooperative-by-design/",
    "/explore/quick-start/",
    "/explore/counter/client-only/",
    "/explore/counter/hydrate-state/",
    "/explore/tutorial/",
    "/explore/tutorial/model-the-domain/",
    "/explore/tutorial/test-the-boundaries/",
    "/explore/ui/",
    "/explore/application-developers/",
    "/explore/refsubject-renderer-independent-state/",
    "/integrate/dom-output/",
    "/integrate/web-component/",
  ]) {
    const response = await page.goto(`${origin}${base}${route}`, {
      waitUntil: "load",
    });
    assert.equal(
      response?.status(),
      200,
      `${route} must resolve to a current lesson`,
    );
    const navigation = await page.evaluate((integration) => {
      const sidebar = document.querySelector(
        ".docs-sidebar [data-docs-navigation]",
      );
      if (!sidebar) throw new Error("Documentation sidebar is missing");
      const links = [...sidebar.querySelectorAll("a")]
        .filter((link) => link.parentElement instanceof HTMLDetailsElement)
        .filter(
          (link) =>
            !integration || new URL(link.href).pathname.includes("/integrate/"),
        );
      const current = links.findIndex(
        (link) => link.getAttribute("aria-current") === "page",
      );
      const footer = document.querySelector(".article-footer");
      if (!footer) throw new Error("Article continuation is missing");
      return {
        current,
        previous: links[current - 1]?.href,
        next: links[current + 1]?.href,
        footer: [...footer.querySelectorAll("a")].map((link) => link.href),
      };
    }, route.startsWith("/integrate/"));
    assert.ok(
      navigation.current >= 0,
      `${route} has no current chapter in the sidebar`,
    );
    if (navigation.previous)
      assert.equal(
        navigation.footer[0],
        navigation.previous,
        `${route} previous`,
      );
    if (navigation.next)
      assert.equal(navigation.footer.at(-1), navigation.next, `${route} next`);
  }
  await page.goto(`${origin}${base}/explore/storybook/`, {
    waitUntil: "domcontentloaded",
  });
  assert.deepEqual(
    await page
      .locator(".article-footer")
      .evaluate((footer) =>
        [...footer.querySelectorAll("a")].map(
          (link) => new URL(link.href).pathname,
        ),
      ),
    [`${base}/explore/ui/`, `${base}/explore/fx-operator-atlas/`],
  );
});
