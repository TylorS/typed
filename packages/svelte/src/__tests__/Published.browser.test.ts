import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template/Render";
import { html } from "@typed/template/RenderTemplate";
import { view } from "@typed/svelte";
import Typed from "@typed/svelte/Typed.svelte";
import { mount, unmount } from "svelte";
import Stateful from "./fixtures/Stateful.svelte";

describe("published Svelte entry points", () => {
  it("runs the precompiled DOM bridge with a compiled application component", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    try {
      await Effect.gen(function* () {
        const props = yield* RefSubject.make({ label: "public" });
        yield* Fx.collectAll(Fx.take(render(view(Stateful, props, { id: "counter" }), target), 1));
        const node = target.querySelector("button");
        yield* RefSubject.set(props, { label: "compiled" });
        yield* Effect.promise(() => expect.poll(() => node?.textContent).toBe("compiled:0"));
        expect(target.querySelector("button")).toBe(node);
      }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
    } finally {
      target.remove();
    }
  });

  it("mounts the exported inverse component without a runtime or compiler option", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    const instance = mount(Typed, {
      target,
      props: { id: "published", value: html`<p>published</p>` },
    });
    try {
      await expect.poll(() => target.textContent).toBe("published");
      expect(target.querySelector("#published")?.getAttribute("style")).toContain(
        "display: contents",
      );
    } finally {
      await unmount(instance);
      target.remove();
    }
  });
});
