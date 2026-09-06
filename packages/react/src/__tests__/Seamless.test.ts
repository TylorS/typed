import { createElement } from "react";
import { renderToReadableStream } from "react-dom/server";
import { prerender } from "react-dom/static";
import { Context, Effect, Layer, ManagedRuntime } from "effect";
import { describe, expect, it, vi } from "vitest";
import { html } from "@typed/template";
import { renderToHtmlString } from "./native.js";
import { view } from "../view.js";
import { Typed } from "../Typed.js";
import { Provider, fromContext, useService } from "../Runtime.js";

async function render(element: ReturnType<typeof createElement>) {
  const stream = await renderToReadableStream(element);
  await stream.allReady;
  return new Response(stream).text();
}

describe("native renderer integration", () => {
  it("selects the React HTML backend from Typed's native HTML renderer", async () => {
    const markup = await Effect.runPromise(
      renderToHtmlString(view(createElement("b", null, "automatic React"), { id: "native" })),
    );
    expect(markup).toContain("<b>automatic React</b>");
  });

  it("renders Typed automatically through React streaming SSR and static prerender", async () => {
    let acquired = 0;
    let released = 0;
    const value = html`<p>
      ${Effect.acquireRelease(
        Effect.sync(() => {
          acquired++;
          return "automatic Typed";
        }),
        () =>
          Effect.sync(() => {
            released++;
          }),
      )}
    </p>`;
    const element = createElement(Typed, { value, onError: () => {} });
    expect(await render(element)).toContain("automatic Typed");
    const { prelude } = await prerender(element);
    expect(await new Response(prelude).text()).toContain("automatic Typed");
    expect(acquired).toBe(2);
    expect(released).toBe(2);
  });

  it("isolates simultaneous server requests even with the same Typed value and host id", async () => {
    class Request extends Context.Service<Request, string>()("ReactSeamlessRequest") {}
    const value = html`<p>
      ${Effect.flatMap(Request, (text) => Effect.promise(async () => text))}
    </p>`;
    const [first, second] = await Promise.all(
      ["first", "second"].map((text) =>
        render(
          createElement(Typed, {
            id: "same-id",
            value,
            runtime: fromContext(Context.make(Request, text)),
            onError: () => {},
          }),
        ),
      ),
    );
    expect(first).toContain("first");
    expect(first).not.toContain("second");
    expect(second).toContain("second");
    expect(second).not.toContain("first");
  });

  it("cancels pending Typed acquisition using the React request's signal", async () => {
    let acquired = 0;
    let released = 0;
    const controller = new AbortController();
    const pending = Effect.acquireRelease(
      Effect.sync(() => {
        acquired++;
      }),
      () =>
        Effect.sync(() => {
          released++;
        }),
    ).pipe(Effect.andThen(Effect.never));
    const callbacks: unknown[] = [];
    const stream = await renderToReadableStream(
      createElement(Typed, {
        value: html`<p>${pending}</p>`,
        signal: controller.signal,
        onError: (error) => callbacks.push(error),
      }),
      { signal: controller.signal, onError: () => {} },
    );
    await vi.waitFor(() => expect(acquired).toBe(1));
    controller.abort();
    await stream.allReady;
    await vi.waitFor(() => expect(released).toBe(1));
    expect(callbacks).toEqual([]);
  });

  it("surfaces producer failures to React's server onError while releasing resources", async () => {
    let released = 0;
    const cause = Effect.acquireRelease(Effect.void, () =>
      Effect.sync(() => {
        released++;
      }),
    ).pipe(Effect.andThen(Effect.fail("producer failed")));
    const errors: unknown[] = [];
    const stream = await renderToReadableStream(
      createElement(Typed, { value: html`<p>${cause}</p>` }),
      {
        onError: (error) => {
          errors.push(error);
        },
      },
    );
    await stream.allReady;
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ _tag: "TypedRenderError" });
    expect(released).toBe(1);
  });

  it("awaits an unprepared borrowed Provider runtime in native React SSR without disposing it", async () => {
    class Request extends Context.Service<Request, string>()("UnpreparedReactRequest") {}
    let acquired = 0;
    let released = 0;
    const runtime = ManagedRuntime.make(
      Layer.effect(
        Request,
        Effect.acquireRelease(
          Effect.promise(async () => {
            acquired++;
            return "provided";
          }),
          () =>
            Effect.sync(() => {
              released++;
            }),
        ),
      ),
    );
    const Component = () => createElement("b", null, useService(Request));
    const value = html`<p>${Effect.map(Request, (text) => text)}</p>`;
    try {
      const output = await render(
        createElement(
          Provider<Request>,
          { runtime },
          createElement(Component),
          createElement(Typed, { value }),
        ),
      );
      expect(output).toContain("<b>provided</b>");
      expect(output).toContain("provided<!--/n_0-->");
      expect(acquired).toBe(1);
      expect(released).toBe(0);
    } finally {
      await runtime.dispose();
    }
    expect(released).toBe(1);
  });
});
