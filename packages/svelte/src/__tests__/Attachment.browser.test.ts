import { describe, expect, it } from "vitest";
import { Effect, ManagedRuntime } from "effect";
import { DomRenderTemplate } from "@typed/template";
import { mount, unmount } from "svelte";
import AttachmentHost from "./fixtures/AttachmentHost.svelte";

describe("Typed attachment", () => {
  it("renders and replaces Typed views without taking ownership of the ManagedRuntime", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    const runtime = ManagedRuntime.make(DomRenderTemplate.using(document));
    let acquires = 0;
    let releases = 0;
    const instance = mount(AttachmentHost, {
      target,
      props: {
        runtime,
        onAcquire: () => acquires++,
        onRelease: () => releases++,
      },
    });
    let mounted = true;

    try {
      await expect.poll(() => target.querySelector("[data-typed-child]")?.textContent).toBe("one");
      await expect.poll(() => acquires).toBe(1);

      target.querySelector<HTMLButtonElement>("[data-update]")!.click();

      await expect.poll(() => target.querySelector("[data-typed-child]")?.textContent).toBe("two");
      await expect.poll(() => acquires).toBe(2);
      await expect.poll(() => releases).toBe(1);

      await unmount(instance);
      mounted = false;
      await expect.poll(() => releases).toBe(2);

      expect(await runtime.runPromise(Effect.succeed(42))).toBe(42);
    } finally {
      if (mounted) await unmount(instance);
      await runtime.dispose();
      target.remove();
    }
  });
});
