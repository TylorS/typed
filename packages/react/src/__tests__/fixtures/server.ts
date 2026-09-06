import { createElement } from "react";
import { renderToReadableStream } from "react-dom/server";
import { Context, Effect, Layer, ManagedRuntime } from "effect";
import { html } from "@typed/template";
import { Provider, useService } from "../../../dist/Runtime.js";
import { Typed } from "../../../dist/Typed.js";

export async function renderProviderFixture() {
  class Text extends Context.Service<Text, string>()("ProviderHydrationText") {}
  let released = 0;
  const runtime = ManagedRuntime.make(
    Layer.effect(
      Text,
      Effect.acquireRelease(
        Effect.promise(async () => "provided"),
        () =>
          Effect.sync(() => {
            released++;
          }),
      ),
    ),
  );
  const Seen = () => createElement("b", null, useService(Text));
  const value = html`<p>${Effect.map(Text, (text) => text)}</p>`;
  try {
    const tree = createElement(
      Provider<Text>,
      { runtime },
      createElement(Seen),
      createElement(Typed, { value }),
    );
    const stream = await renderToReadableStream(tree);
    await stream.allReady;
    const html = await new Response(stream).text();
    return { html, releasedBeforeDisposal: released };
  } finally {
    await runtime.dispose();
  }
}
