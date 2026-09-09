import * as Fx from "@typed/fx/Fx";
import { HtmlRenderEvent } from "@typed/template/RenderEvent";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Stream from "effect/Stream";
import { createSSRApp, h, type Component } from "vue";
import { renderToWebStream, type SSRContext } from "vue/server-renderer";
import { VueError, type PropsSource, type ViewOptions } from "../view.js";
import { fromContext, installRuntime } from "../Runtime.js";
import { sourceFx } from "./source.js";

/** Vue streams its content in tree order into the native template child. */
export const renderVue = Fx.fn(function* <P extends object, E, R>(
  component: Component,
  source: PropsSource<P, E, R>,
  viewOptions: ViewOptions & { readonly id: string },
) {
  const services = yield* Effect.context<never>();
  const first = yield* Fx.first(sourceFx(source));
  if (Option.isNone(first)) return Fx.succeed(HtmlRenderEvent("", true));

  const context: SSRContext = {};
  let failure: VueError | undefined;

  const readable = yield* Effect.try({
    try: () => {
      const app = createSSRApp({ render: () => h(component, first.value) });
      app.config.idPrefix = viewOptions.id;
      installRuntime(app, fromContext(services));
      viewOptions.configureApp?.(app);

      const configuredHandler = app.config.errorHandler;
      app.config.errorHandler = (error, instance, info) => {
        failure = new VueError("server", error);

        try {
          configuredHandler?.(error, instance, info);
        } catch (cause) {
          failure = new VueError("server", cause);
        }
      };

      return renderToWebStream(app, context);
    },
    catch: (cause) => new VueError("server", cause),
  });

  const chunks = Stream.fromReadableStream({
    evaluate: () => readable,
    onError: (cause) => new VueError("server", cause),
  }).pipe(
    Stream.decodeText,
    Stream.map((chunk) => HtmlRenderEvent(chunk, false)),
  );

  // Vue can report an async prefetch error while still completing its native stream.
  const completed = Stream.fromEffect(
    Effect.gen(function* () {
      if (failure) return yield* Effect.fail(failure);

      yield* Effect.tryPromise({
        try: async () => {
          await viewOptions.onSSRContext?.(context);
        },
        catch: (cause) => new VueError("server", cause),
      });

      return HtmlRenderEvent("", true);
    }),
  );

  return Fx.fromStream(Stream.concat(chunks, completed));
});
