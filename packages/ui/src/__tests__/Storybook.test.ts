import { assert, describe, expect, it } from "vitest";
import { Window } from "happy-dom";
import { Fx } from "@typed/fx";
import * as Button from "../Button.js";
import * as Storybook from "../Storybook.js";

describe("typed/ui/Storybook", () => {
  it("keeps a Typed component mounted in an isolated Storybook canvas", async () => {
    const window = new Window() as unknown as globalThis.Window & typeof globalThis;
    const story = await Storybook.mount(Button.Button({ content: "Save" }), window.document);

    try {
      const button = story.canvas.querySelector("button");
      assert.strictEqual(button?.textContent, "Save");
      assert.strictEqual(button?.type, "button");
    } finally {
      await story.dispose();
    }
  });

  it("rejects when the story fails before its first render", async () => {
    const window = new Window() as unknown as globalThis.Window & typeof globalThis;

    await expect(
      Storybook.mount(Fx.fail(new Error("story failed")), window.document),
    ).rejects.toThrow("story failed");
  });

  it("rejects when the story completes before its first render", async () => {
    const window = new Window() as unknown as globalThis.Window & typeof globalThis;

    await expect(Storybook.mount(Fx.empty, window.document)).rejects.toThrow(
      "Story completed before rendering any content",
    );
  });
});
