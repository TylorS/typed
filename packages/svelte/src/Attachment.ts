import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as Layer from "effect/Layer";
import type * as Scope from "effect/Scope";
import * as Fx from "@typed/fx/Fx";
import * as Subject from "@typed/fx/Subject";
import { DomRenderTemplate, render } from "@typed/template/Render";
import type { Renderable } from "@typed/template/Renderable";
import type { RenderTemplate } from "@typed/template/RenderTemplate";
import { rootEvents, type RootEventOptions } from "@typed/template/RootEvents";
import type { Runtime } from "./Runtime.js";

/** Options for the render scope owned by a native Svelte attachment. */
export interface AttachmentOptions<E> {
  readonly stopPropagation?: RootEventOptions;

  /** Runs after Typed attaches its first output; nested frameworks commit on their own schedule. */
  readonly onReady?: () => void;

  readonly onError?: (cause: Cause.Cause<E>) => void;
}

const assignments = new WeakMap<HTMLElement, (view: Fx.Fx<unknown>) => () => void>();

/** Supplies the native DOM renderer and a scope while borrowing the runtime. */
export function attachment<const V extends Renderable.Any, ER = never>(
  runtime: Pick<
    Runtime<Exclude<Exclude<Renderable.Services<V>, RenderTemplate>, Scope.Scope>, ER>,
    "runFork"
  >,
  value: V,
  options: AttachmentOptions<Renderable.Error<V> | ER> = {},
): (element: HTMLElement) => () => void {
  return (element) => {
    const view = Fx.fromEffect(
      Effect.acquireUseRelease(
        Effect.sync(() => runtime.runFork(Layer.launch(renderLayer(value, element, options)))),
        Fiber.join,
        Fiber.interrupt,
      ),
    ).pipe(
      Fx.catchCause((cause) => {
        if (!Cause.hasInterruptsOnly(cause)) {
          if (options.onError) options.onError(cause);
          else element.dispatchEvent(new CustomEvent("typed:error", { detail: cause }));
        }

        return Fx.empty;
      }),
    );

    return (assignments.get(element) ?? mount(element))(view);
  };
}

function mount(element: HTMLElement): (view: Fx.Fx<unknown>) => () => void {
  const changes = Subject.unsafeMake<Fx.Fx<unknown>>(1);
  let current: Fx.Fx<unknown> | undefined;

  Effect.runFork(
    changes.pipe(
      Fx.switchMap((view) => Fx.suspend(() => (current === view ? view : Fx.empty))),
      Fx.ensuring(
        Effect.sync(() => {
          if (assignments.get(element) === assign) assignments.delete(element);
        }),
      ),
      Fx.drain,
      Effect.scoped,
    ),
  );

  function assign(view: Fx.Fx<unknown>) {
    current = view;
    Effect.runFork(changes.onSuccess(view));

    return () => {
      if (current !== view) return;
      current = undefined;

      Effect.runFork(
        changes.onSuccess(Fx.empty).pipe(
          Effect.andThen(() => {
            if (current !== undefined) return Effect.void;

            if (assignments.get(element) === assign) assignments.delete(element);
            return changes.interrupt;
          }),
        ),
      );
    };
  }

  assignments.set(element, assign);

  return assign;
}

const renderLayer = <V extends Renderable.Any>(
  value: V,
  element: HTMLElement,
  options: AttachmentOptions<Renderable.Error<V>>,
) =>
  Fx.gen(function* () {
    const ready = yield* Effect.cached(Effect.sync(() => options.onReady?.()));

    if (options.stopPropagation !== false) yield* rootEvents(element, options.stopPropagation);

    return render(value, element).pipe(Fx.tap(() => ready));
  }).pipe(
    Fx.provide(DomRenderTemplate.using(element.ownerDocument)),
    Fx.drain,
    Layer.effectDiscard,
  );
