import * as Fx from "@typed/fx/Fx";
import { rootEvents } from "@typed/template/RootEvents";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { createApp, createSSRApp, h, nextTick, shallowRef, type App, type Component } from "vue";
import { sourceFx } from "./source.js";
import { fromContext, installRuntime } from "../Runtime.js";
import { VueError, type PropsSource, type ViewOptions } from "../view.js";

/** The native ref supplies the host, including its existing Vue markup during hydration. */
export function mountComponent<P extends object, E, R>(
  target: HTMLElement,
  component: Component,
  source: PropsSource<P, E, R>,
  options: ViewOptions,
  ready: Deferred.Deferred<void, E | VueError>,
  hydrate: boolean,
) {
  return Effect.gen(function* () {
    yield* rootEvents(target, options.stopPropagation);

    const services = yield* Effect.context<R>();
    const failed = yield* Deferred.make<void, E | VueError>();
    const props = shallowRef<P>();

    let app: App | undefined;
    let mounted = false;
    let closed = false;
    let phase: "mount" | "update" = "mount";
    let failure: VueError | undefined;

    yield* Effect.addFinalizer(() =>
      Effect.sync(() => {
        closed = true;
        if (mounted) app!.unmount();
      }),
    );

    const updates = Fx.observe(sourceFx(source), (value) =>
      Effect.gen(function* () {
        if (closed) return;

        yield* Effect.try({
          try: () => {
            props.value = value;
            // The root render effect tracks this shallowRef, so updates rerender through Vue.
            if (app) return;

            app = (hydrate ? createSSRApp : createApp)({
              render: () => h(component, props.value),
            });

            app.config.idPrefix = options.id;
            installRuntime(app, fromContext(services));
            options.configureApp?.(app);

            const configuredHandler = app.config.errorHandler;
            app.config.errorHandler = (cause, instance, info) => {
              if (closed) return;

              failure = new VueError(phase, cause);

              try {
                configuredHandler?.(cause, instance, info);
              } catch (handlerCause) {
                failure = new VueError(phase, handlerCause);
              }

              // Initialization reports its own failure before the root can publish.
              if (phase === "update") Deferred.doneUnsafe(failed, Effect.fail(failure));
            };

            app.mount(target);
            mounted = true;
            if (failure) throw failure;
          },
          catch: (cause) => (cause instanceof VueError ? cause : new VueError(phase, cause)),
        });

        yield* Effect.tryPromise({
          try: () => nextTick(),
          catch: (cause) => new VueError(phase, cause),
        });

        if (failure) return yield* Effect.fail(failure);

        phase = "update";
        yield* Deferred.succeed(ready, undefined);
      }),
    );

    // A completed source retains the mounted app. An empty source reserves an empty native host.
    yield* updates.pipe(
      Effect.andThen(Deferred.succeed(ready, undefined)),
      Effect.catchCause((cause) => Deferred.failCause(failed, cause)),
      Effect.forkScoped,
    );

    return yield* Deferred.await(failed);
  }).pipe(Layer.effectDiscard);
}
