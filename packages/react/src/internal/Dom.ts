import { createElement, type ReactNode } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import * as Cause from "effect/Cause";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import * as Scope from "effect/Scope";
import * as Semaphore from "effect/Semaphore";
import * as Fx from "@typed/fx/Fx";
import type { Sink } from "@typed/fx/Sink";
import type { DomRenderEvent, RenderEvent } from "@typed/template/RenderEvent";
import { rootEvents } from "@typed/template/RootEvents";
import { ReactRenderError, type ViewOptions } from "../view.js";
import { RootView } from "./RootView.js";

export const render = Fx.fn(function* <E, R>(
  target: HTMLElement,
  event: DomRenderEvent,
  elements: Fx.Fx<ReactNode, E, R>,
  options: ViewOptions,
  hydrate: boolean,
) {
  const scope = yield* Scope.fork(yield* Scope.Scope);
  const complete = yield* Deferred.make<void>();
  const prepared = yield* Deferred.make<void>();
  let published = false;
  let failed = false;

  return Fx.make<RenderEvent, E | ReactRenderError, R>(function <RSink>(
    sink: Sink<RenderEvent, E | ReactRenderError, RSink>,
  ) {
    const onFailure = (cause: Cause.Cause<E | ReactRenderError>) =>
      Effect.sync(() => {
        failed = true;
      }).pipe(
        Effect.andThen(Deferred.succeed(prepared, undefined)),
        Effect.andThen(() => sink.onFailure(cause)),
      );

    return Effect.gen(function* () {
      yield* mount(target, elements, options, complete, prepared, onFailure, hydrate).pipe(
        Layer.launch,
        Effect.forkIn(scope),
      );
      yield* Deferred.await(prepared);
      if (failed) return;

      published = true;
      // Native insertion happens when this event reaches the enclosing template.
      // React commits asynchronously; observing an event does not await its effects.
      yield* sink.onSuccess(event);
      yield* Deferred.await(complete);
    }).pipe(
      Scope.provide(scope),
      Effect.onExit((exit) => (published && !failed ? Effect.void : Scope.close(scope, exit))),
    );
  });
});

const mount = Effect.fn(function* <E, R, RSink>(
  target: HTMLElement,
  elements: Fx.Fx<ReactNode, E, R>,
  options: ViewOptions,
  complete: Deferred.Deferred<void>,
  prepared: Deferred.Deferred<void>,
  onFailure: (cause: Cause.Cause<E | ReactRenderError>) => Effect.Effect<unknown, never, RSink>,
  hydrate: boolean,
) {
  yield* rootEvents(target, options.stopPropagation);
  const services = yield* Effect.context<R | RSink>();

  let root: Root | undefined;
  let update: ((element: ReactNode) => void) | undefined;
  let active = true;
  const updates = yield* Semaphore.make(1);

  yield* Effect.addFinalizer(() =>
    Effect.promise(async () => {
      active = false;
      // Nested React commits may initiate cleanup; leave their commit before unmounting.
      await Promise.resolve();
      root?.unmount();
    }),
  );

  yield* Fx.observe(elements, (element) =>
    updates.withPermit(
      Effect.callback<void, ReactRenderError>((resume) => {
        if (update) {
          update(element);
          resume(Effect.void);
          return;
        }

        const onUncaughtError = (cause: unknown) => {
          if (!active) return;
          const error = new ReactRenderError(cause);
          if (update) Effect.runForkWith(services)(onFailure(Cause.fail(error)));
          else resume(Effect.fail(error));
        };

        const tree = createElement(RootView, {
          element,
          context: services,
          ready: (setElement) => {
            if (!active) return;
            update = setElement;
            resume(Effect.void);
          },
        });
        const rootOptions = {
          identifierPrefix: options.identifierPrefix ?? options.id,
          onRecoverableError: options.onRecoverableError,
          onUncaughtError,
        };

        try {
          if (hydrate) root = hydrateRoot(target, tree, rootOptions);
          else {
            root = createRoot(target, rootOptions);
            root.render(tree);
          }

          Deferred.doneUnsafe(prepared, Exit.void);
        } catch (cause) {
          resume(Effect.fail(new ReactRenderError(cause)));
        }
      }),
    ),
  ).pipe(Effect.catchCause(onFailure));

  yield* Deferred.succeed(prepared, undefined);
  yield* Deferred.succeed(complete, undefined);
}, Layer.effectDiscard);
