import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { preview } from "astro";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const base = (process.env.SITE_BASE ?? "/typed/").replace(/\/$/u, "");

test(
  "the website ships the maintained stories with working controls, keyboard input, and themes",
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
    const page = await browser.newPage({
      colorScheme: "dark",
      viewport: { width: 1440, height: 1000 },
    });
    /** @type {string[]} */
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    const index = await fetch(`${origin}${base}/storybook/index.json`).then((response) => {
      assert.equal(response.status, 200, "the Storybook index is part of the static site");
      return response.json();
    });
    for (const group of ["Foundations", "Inputs", "Patterns"]) {
      const source = await readFile(
        new URL(`../../../packages/ui/stories/${group}.stories.ts`, import.meta.url),
        "utf8",
      );
      for (const [, name] of source.matchAll(/^export const (\w+)\s*=/gmu)) {
        assert.ok(
          Object.values(index.entries).some(
            (entry) => entry.title === group && entry.exportName === name,
          ),
          `${group}.${name} is included in the published Storybook`,
        );
      }
    }

    const response = await page.goto(`${origin}${base}/explore/storybook/`);
    assert.ok(response, "navigation returns an HTTP response");
    assert.equal(response.status(), 200);
    const manager = page.frameLocator('iframe[title="Typed UI component Storybook"]');
    const story = manager.frameLocator("#storybook-preview-iframe");
    const save = story.getByRole("button", { name: "Save changes", exact: true });
    await save.waitFor();
    await save.focus();
    await page.keyboard.press("Enter");
    await story.getByText("Changes saved 1 time", { exact: true }).waitFor();

    await page.waitForFunction(() =>
      [...document.querySelectorAll("astro-island")].every((island) => !island.hasAttribute("ssr")),
    );
    await page.getByRole("button", { name: "Switch color theme" }).click();
    await page.waitForFunction(() => {
      const manager = document.querySelector("iframe")?.contentDocument;
      const frame = [...(manager?.querySelectorAll("iframe") ?? [])].find(
        (frame) => frame.id === "storybook-preview-iframe",
      );
      const story = frame?.contentDocument;
      return (
        document.documentElement.dataset.theme === "matrix-light" &&
        manager?.documentElement.dataset.theme === "matrix-light" &&
        story?.documentElement.dataset.theme === "matrix-light"
      );
    });
    assert.equal(
      await story.getByText("Changes saved 1 time", { exact: true }).count(),
      1,
      "changing the website theme keeps the current story state",
    );

    // The manager keeps its native controls and navigation inside the embed.
    await manager.getByRole("tab", { name: /^Controls/ }).click();
    await manager.locator("#control-initialCount").focus();
    await page.keyboard.press("Home");
    for (let count = 0; count < 3; count++) await page.keyboard.press("ArrowRight");
    await story.getByText("Changes saved 3 times", { exact: true }).waitFor();
    await manager.getByRole("link", { name: "Checkbox", exact: true }).click();
    const checkbox = story.getByRole("checkbox", { name: "Subscribe to updates" });
    await checkbox.waitFor();
    assert.equal(await checkbox.isChecked(), true);
    await checkbox.uncheck();
    assert.equal(await checkbox.isChecked(), false);

    // Exercise the repaired controls inside the shipped, nested Storybook frames.
    /** @param {string} id */
    const selectStory = async (id) => {
      const frame = page.frames().find((frame) => frame.parentFrame() === page.mainFrame());
      assert.ok(frame, "the website owns an embedded Storybook manager");
      await frame.goto(`${origin}${base}/storybook/?path=/story/${id}`);
    };
    await selectStory("inputs--form");
    const phone = story.getByRole("textbox", { name: "Phone (10 digits)", exact: true });
    await phone.fill("");
    await phone.pressSequentially("0200010002");
    await phone.evaluate((input) => {
      if (!(input instanceof HTMLInputElement)) throw new Error("Expected a phone input");
      if (input.value !== "(020) 001-0002" || !input.validity.valid) {
        throw new Error(`Invalid phone mask result: ${input.value}`);
      }
    });
    await story.getByRole("button", { name: "Save contact", exact: true }).click();
    await story.getByText("Saved hello@example.com: (020) 001-0002.", { exact: true }).waitFor();

    await selectStory("patterns--tabs");
    const overview = story.getByRole("tab", { name: "Overview", exact: true });
    await overview.click();
    await overview.press("ArrowRight");
    const activity = story.getByRole("tab", { name: "Activity", exact: true });
    const activityPanel = story.getByRole("tabpanel", { name: "Activity", exact: true });
    await activityPanel.waitFor();
    assert.equal(await activity.getAttribute("aria-selected"), "true");
    await activity.press("Tab");
    assert.ok(
      await activityPanel.evaluate((panel) => panel.ownerDocument.activeElement === panel),
      "Tab moves from the active tab into its panel",
    );
    const tabSpacing = await overview.evaluate((tab) => ({
      padding: Number.parseFloat(getComputedStyle(tab).paddingInlineStart),
      height: tab.getBoundingClientRect().height,
    }));
    assert.ok(
      tabSpacing.padding >= 12 && tabSpacing.height >= 44,
      "tabs have readable spacing and usable targets",
    );

    await selectStory("patterns--window-splitter");
    const separator = story.getByRole("separator", { name: "Table of contents" });
    await separator.waitFor();
    await separator.scrollIntoViewIfNeeded();
    const divider = await separator.boundingBox();
    const initialSize = Number(await separator.getAttribute("aria-valuenow"));
    assert.ok(divider, "the splitter has a draggable handle");
    await page.mouse.move(divider.x + divider.width / 2, divider.y + divider.height / 2);
    await page.mouse.down();
    await page.mouse.move(divider.x + divider.width / 2 + 80, divider.y + divider.height / 2, {
      steps: 8,
    });
    await page.mouse.up();
    assert.ok(
      Number(await separator.getAttribute("aria-valuenow")) > initialSize,
      "dragging the embedded divider resizes its pane",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      "the embed fits a narrow page",
    );
    await page.getByRole("link", { name: "Skip the interactive Storybook" }).click();
    assert.equal(await page.evaluate(() => document.activeElement?.id), "after-storybook");
    assert.deepEqual(errors, []);
  },
);
