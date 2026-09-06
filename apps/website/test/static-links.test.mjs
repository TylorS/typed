import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { test } from "node:test";

const websiteRoot = path.resolve(import.meta.dirname, "..");
const siteRoot = path.join(websiteRoot, "dist/site");
const repositoryRoot = path.resolve(websiteRoot, "../..");
const base = (process.env.SITE_BASE ?? "/typed/").replace(/\/$/u, "");
/** @param {string} text */
const decode = (text) =>
  text.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'");

/** @param {string} root
 * @returns {Promise<string[]>}
 */
async function filesIn(root) {
  return (await fs.readdir(root, { withFileTypes: true }))
    .flatMap((entry) => (entry.isDirectory() ? [] : [path.join(root, entry.name)]))
    .concat(
      ...(await Promise.all(
        (await fs.readdir(root, { withFileTypes: true }))
          .filter((entry) => entry.isDirectory())
          .map((entry) => filesIn(path.join(root, entry.name))),
      )),
    );
}

test("every built page link, local anchor, and asset resolves under the deployment base", async () => {
  const files = await filesIn(siteRoot);
  const paths = new Set(files);
  const pages = new Map(
    await Promise.all(
      files
        .filter((file) => file.endsWith(".html"))
        .map(async (file) => /** @type {const} */ ([file, await fs.readFile(file, "utf8")])),
    ),
  );
  const ids = new Map(
    [...pages].map(([file, html]) => [
      file,
      new Set([...html.matchAll(/<[a-z][^>]*?\sid="([^"]+)"/giu)].map((match) => decode(match[1]))),
    ]),
  );
  const broken = new Set();
  const sourceTargets = new Map();
  for (const [file, html] of pages) {
    const relative = path.relative(siteRoot, file).replace(/index\.html$/u, "");
    const seen = new Set();
    for (const [, id] of html.matchAll(/<[a-z][^>]*?\sid="([^"]+)"/giu)) {
      if (seen.has(id)) broken.add(`${relative}: duplicate id ${id}`);
      seen.add(id);
    }
    const pageUrl = `https://docs.test${base}/${relative}`;
    for (const [, encoded] of html.matchAll(
      /<(?:a|link|script|img|source)\b[^>]*?\b(?:href|src)="([^"]+)"/gu,
    )) {
      const href = decode(encoded);
      const url = new URL(href, pageUrl);
      const source = url.origin === "https://github.com"
        ? url.pathname.match(/^\/TylorS\/typed\/(?:blob|tree)\/development\/(.+)$/u)
        : null;
      if (source) {
        const sourcePath = decodeURIComponent(source[1]);
        if (!sourceTargets.has(sourcePath)) {
          sourceTargets.set(sourcePath, await fs.access(path.join(repositoryRoot, sourcePath))
            .then(() => true, () => false));
        }
        if (!sourceTargets.get(sourcePath)) broken.add(`${relative}: missing source ${href}`);
      }
      if (url.origin !== "https://docs.test") continue;
      if (base && !url.pathname.startsWith(`${base}/`)) {
        broken.add(`${relative}: missing base ${href}`);
        continue;
      }
      const pathname = decodeURIComponent(url.pathname.slice(base.length));
      const target = path.join(siteRoot, pathname);
      const candidates = [target, path.join(target, "index.html")];
      const existing = candidates.find((candidate) => paths.has(candidate));
      if (!existing) {
        broken.add(`${relative}: ${href}`);
        continue;
      }
      if (
        existing.endsWith("index.html") &&
        !url.pathname.endsWith("/") &&
        !url.pathname.endsWith("index.html")
      )
        broken.add(`${relative}: missing trailing slash ${href}`);
      if (
        url.hash &&
        ids.has(existing) &&
        !ids.get(existing)?.has(decodeURIComponent(url.hash.slice(1)))
      )
        broken.add(`${relative}: missing anchor ${href}`);
    }
  }
  assert.equal(
    broken.size,
    0,
    [...broken].slice(0, 80).join("\n") +
      `\n${broken.size} broken links across ${pages.size} pages`,
  );
  assert.ok(pages.size > 1000, "the exhaustive reference must be included");
});

test("every source-derived reference and search target has a static HTML page", async () => {
  /** @type {unknown} */
  const inventory = JSON.parse(
    await fs.readFile(path.join(websiteRoot, "src/generated/reference.json"), "utf8"),
  );
  /** @type {unknown} */
  const search = JSON.parse(await fs.readFile(path.join(siteRoot, "search-index.json"), "utf8"));
  assert.ok(inventory && typeof inventory === "object" && "routes" in inventory);
  assert.ok(search && typeof search === "object" && "entries" in search);
  /** @param {unknown} entries
   * @param {string} field
   * @returns {string[]}
   */
  const destinations = (entries, field) => {
    assert.ok(Array.isArray(entries));
    /** @type {unknown[]} */
    const values = entries;
    return values.map((entry) => {
      assert.ok(entry && typeof entry === "object" && field in entry);
      /** @type {unknown} */
      const href = Reflect.get(entry, field);
      assert.ok(typeof href === "string");
      return href;
    });
  };
  const routes = [
    ...destinations(inventory.routes, "canonicalPath"),
    ...destinations(search.entries, "href"),
  ];
  const missing = [];
  for (const route of routes) {
    const url = new URL(route, "https://docs.test");
    const file = path.join(siteRoot, decodeURIComponent(url.pathname), "index.html");
    try {
      await fs.access(file);
    } catch {
      missing.push(route);
    }
  }
  assert.deepEqual(missing, []);
});
