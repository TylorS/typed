import { html } from "@typed/template";
import { Window } from "happy-dom";
import { assert, describe, it, vi } from "vitest";
import { component } from "../../src/Component.js";
import { story } from "../story.js";

interface GreetingProps {
  readonly label: string;
  readonly count: number;
}

const Greeting = component(
  // oxlint-disable-next-line require-yield
  function* ({ label, count }: GreetingProps) {
    return html`<p>${label}: ${count}</p>`;
  },
);

describe("ui/stories/story", () => {
  it("exposes component props as Storybook args", () => {
    const definition = story(Greeting, { label: "Initial", count: 1 });

    assert.deepEqual(definition.args, { label: "Initial", count: 1 });
  });

  it("remounts the component with updated Storybook args", async () => {
    const definition = story(Greeting, { label: "Initial", count: 1 });
    const window = new Window() as unknown as globalThis.Window & typeof globalThis;
    const loader = Array.isArray(definition.loaders) ? definition.loaders[0] : definition.loaders;
    const render = definition.render;

    if (loader === undefined) assert.fail("Expected a Storybook loader");
    if (render === undefined) assert.fail("Expected a Storybook render function");
    vi.stubGlobal("document", window.document);

    try {
      await loader({ args: { label: "First", count: 1 } } as never);
      const firstCanvas = render({ label: "First", count: 1 }, {} as never) as HTMLElement;
      assert.strictEqual(firstCanvas.textContent, "First: 1");

      await loader({ args: { label: "Second", count: 2 } } as never);
      const secondCanvas = render({ label: "Second", count: 2 }, {} as never) as HTMLElement;
      assert.strictEqual(secondCanvas.textContent, "Second: 2");
      assert.notStrictEqual(secondCanvas, firstCanvas);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
