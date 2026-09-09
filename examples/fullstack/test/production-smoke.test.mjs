import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createInterface } from "node:readline";
import { test } from "node:test";
import { chromium } from "playwright";

test(
  "production serves assets and hydrates the server counter in place",
  { timeout: 30_000 },
  async (t) => {
    const server = spawn(process.execPath, ["dist/server/server.js", "--port", "0"], {
      cwd: new URL("../", import.meta.url),
      stdio: ["ignore", "pipe", "inherit"],
    });
    t.after(async () => {
      if (server.exitCode !== null) return;
      const stopped = once(server, "exit");
      server.kill("SIGTERM");
      await stopped;
    });
    const lines = createInterface({ input: server.stdout });
    let origin;
    for await (const line of lines) {
      const match = /Listening on http:\/\/[^:]+:(\d+)/.exec(line);
      if (match) {
        origin = `http://127.0.0.1:${match[1]}`;
        break;
      }
    }
    assert.ok(origin, "the production server started");
    const response = await fetch(origin);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Full-stack counter/);
    const asset = await fetch(`${origin}/client.js`);
    assert.equal(asset.status, 200);
    assert.match(asset.headers.get("content-type"), /javascript/);

    const browser = await chromium.launch();
    t.after(() => browser.close());
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      const observer = new MutationObserver(() => {
        const output = document.querySelector("output");
        if (output) {
          window.serverOutput = output;
          observer.disconnect();
        }
      });
      observer.observe(document, { childList: true, subtree: true });
    });
    await page.goto(origin, { waitUntil: "networkidle" });
    assert.equal(await page.locator("output").textContent(), "42");
    assert.ok(await page.evaluate(() => document.querySelector("output") === window.serverOutput));
    await page.getByRole("button", { name: "Increment", exact: true }).click();
    await page.waitForFunction(() => document.querySelector("output")?.textContent === "43");
    await page.getByRole("button", { name: "Decrement", exact: true }).click();
    await page.waitForFunction(() => document.querySelector("output")?.textContent === "42");
    assert.deepEqual(errors, []);
  },
);
