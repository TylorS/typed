import type { RandomValues } from "@typed/id/RandomValues";
import * as Effect from "effect/Effect";
import * as Scope from "effect/Scope";
import * as Option from "effect/Option";
import { rootIdentity } from "@typed/template/RootIdentity";
import { HydrateContext } from "@typed/template/HydrateContext";
import type * as Stream from "effect/Stream";
import * as Fx from "@typed/fx/Fx";
import type { RootEventOptions } from "@typed/template/RootEvents";
import { html, type RenderTemplate } from "@typed/template/RenderTemplate";
import { isDomRenderEvent, DomRenderEvent, type RenderEvent } from "@typed/template/RenderEvent";
import { createElement, type ComponentType, type ReactNode } from "react";
import { isValidElementType } from "react-is";
import { sourceFx } from "./internal/source.js";

/** A props object, or a producer of complete props objects. Use Fx.struct for reactive fields. */
export type PropsSource<P, E = never, R = never> =
  | P
  | Fx.Fx<P, E, R>
  | Effect.Effect<P, E, R>
  | Stream.Stream<P, E, R>;

export interface ViewOptions {
  /** Optional host identity override. Generated per render and restored during hydration by default. */
  readonly id?: string;

  /** Stops selected events at the automatic host; undefined inherits CurrentRootEvents. */
  readonly stopPropagation?: RootEventOptions;

  /** Must match between server and browser; give independent roots distinct prefixes when using useId. */
  readonly identifierPrefix?: string;

  /** Recoverable hydration diagnostics, forwarded directly from React. */
  readonly onRecoverableError?: (error: unknown) => void;
}

/** An exception reported by React's renderer. Producer errors retain their own E channel. */
export class ReactRenderError extends Error {
  readonly _tag = "ReactRenderError";

  constructor(override readonly cause: unknown) {
    super("React rendering failed", { cause });
  }
}

/** Render an existing React node through the same scoped DOM/HTML interpreter. */
export function view(
  node: ReactNode,
  options?: ViewOptions,
): Fx.Fx<RenderEvent, ReactRenderError, Scope.Scope | RenderTemplate | RandomValues>;

/** Render a React component with reactive props. Updates preserve its root and component state. */
export function view<P extends object, E = never, R = never>(
  component: ComponentType<P>,
  props: PropsSource<NoInfer<P>, E, R>,
  options?: ViewOptions,
): Fx.Fx<RenderEvent, E | ReactRenderError, R | Scope.Scope | RenderTemplate | RandomValues>;

export function view<P extends object, E = never, R = never>(
  first: ReactNode | ComponentType<P>,
  second?: ViewOptions | PropsSource<P, E, R>,
  third?: ViewOptions,
): Fx.Fx<RenderEvent, E | ReactRenderError, R | Scope.Scope | RenderTemplate | RandomValues> {
  const component = typeof first !== "string" && isValidElementType(first);
  const nodes: Fx.Fx<ReactNode, E, R> = component
    ? Fx.map(sourceFx(second as PropsSource<P, E, R>), (value) =>
        createElement(first as ComponentType<P>, value),
      )
    : Fx.succeed(first as ReactNode);
  const settings = (component ? third : (second as ViewOptions | undefined)) ?? {};

  return Fx.gen(function* () {
    const scope = yield* Effect.scope;
    const identity = yield* rootIdentity(settings.id);
    let target: HTMLElement | undefined;
    let hydrate = false;

    const ref = (element: HTMLElement) => {
      target = element;
    };

    const content = Fx.gen(function* () {
      if (target === undefined) {
        const renderer = yield* Effect.promise(() => import("./internal/Html.js"));

        return renderer.render(nodes, { ...settings, id: yield* identity.id });
      }

      const hydration = Option.getOrUndefined(yield* Effect.serviceOption(HydrateContext));
      const hole = hydration?.where;
      hydrate = hole?._tag === "hole";

      // The DOM branch emits once. React owns these children after this handoff;
      // Typed keeps ownership of the host and its surrounding template range.
      if (hole?._tag === "hole") {
        hole.startComment.remove();
        hole.endComment.remove();
      }

      return Fx.succeed(DomRenderEvent([]));
    });

    return html`<div
      ...${{ ref: identity.ref }}
      id=${identity.id}
      style="display:contents"
      ref=${ref}
    >
      ${content}
    </div>`.pipe(
      Fx.provideService(Scope.Scope, scope),
      Fx.concatMap((event): Fx.Fx<RenderEvent, E | ReactRenderError, R> => {
        if (!isDomRenderEvent(event)) return Fx.succeed(event);

        const element = target;
        if (element === undefined)
          return Fx.die(new TypeError("React view requires a native host ref"));

        return Fx.gen(function* () {
          const renderer = yield* Effect.promise(() => import("./internal/Dom.js"));

          return renderer
            .render(element, event, nodes, { ...settings, id: yield* identity.id }, hydrate)
            .pipe(Fx.provideService(Scope.Scope, scope));
        });
      }),
    );
  });
}
