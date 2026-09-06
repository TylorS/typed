import { createElement, type ReactNode } from "react";
import { renderToReadableStream } from "react-dom/server";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Stream from "effect/Stream";
import * as Fx from "@typed/fx/Fx";
import { HtmlRenderEvent } from "@typed/template/RenderEvent";
import { ReactRenderError, type ViewOptions } from "../view.js";
import { RootView } from "./RootView.js";

/** React streams its shell and Suspense updates into the native template child. */
export const render = Fx.fn(function* <E, R>(
  elements: Fx.Fx<ReactNode, E, R>,
  options: ViewOptions,
) {
  const context = yield* Effect.context<never>();
  const first = yield* Fx.first(elements);
  if (Option.isNone(first)) return Fx.succeed(HtmlRenderEvent("", true));

  const controller = yield* Effect.acquireRelease(
    Effect.sync(() => new AbortController()),
    (controller) => Effect.sync(() => controller.abort()),
  );
  let failure: ReactRenderError | undefined;

  const readable = yield* Effect.tryPromise({
    try: () =>
      renderToReadableStream(createElement(RootView, { element: first.value, context }), {
        identifierPrefix: options.identifierPrefix ?? options.id,
        signal: controller.signal,
        onError: (cause) => {
          failure = new ReactRenderError(cause);
        },
      }),
    catch: (cause) => new ReactRenderError(cause),
  });

  const chunks = Stream.fromReadableStream({
    evaluate: () => readable,
    onError: (cause) => new ReactRenderError(cause),
  }).pipe(
    Stream.decodeText,
    Stream.map((chunk) => HtmlRenderEvent(chunk, false)),
  );

  // React may encode a recoverable Suspense error into its output instead of rejecting a read.
  const completed = Stream.fromEffect(
    Effect.suspend(() =>
      failure ? Effect.fail(failure) : Effect.succeed(HtmlRenderEvent("", true)),
    ),
  );

  return Fx.fromStream(Stream.concat(chunks, completed));
});
