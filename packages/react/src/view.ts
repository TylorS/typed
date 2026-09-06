import * as Effect from "effect/Effect";
import * as Scope from "effect/Scope";
import * as Option from "effect/Option";
import { HydrateContext } from "@typed/template/HydrateContext";
import type * as Stream from "effect/Stream";
import * as Fx from "@typed/fx/Fx";
import type { RootEventOptions } from "@typed/template/RootEvents";
import { html, type RenderTemplate } from "@typed/template/RenderTemplate";
import { isDomRenderEvent, DomRenderEvent, type RenderEvent } from "@typed/template/RenderEvent";
import { createElement, type ComponentType, type ReactNode } from "react";
import { sourceFx } from "./internal/source.js";

/** A props object, or a producer of complete props objects. Use Fx.struct for reactive fields. */
export type PropsSource<P, E = never, R = never> =
  | P
  | Fx.Fx<P, E, R>
  | Effect.Effect<P, E, R>
  | Stream.Stream<P, E, R>;

export interface ViewOptions {
  /** Unique island identity, identical between SSR and hydration. Also the default React identifierPrefix. */
  readonly id: string;

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
  options: ViewOptions,
): Fx.Fx<RenderEvent, ReactRenderError, Scope.Scope | RenderTemplate>;

/** Render a React component with reactive props. Updates preserve its root and component state. */
export function view<P extends object, E = never, R = never>(
  component: ComponentType<P>,
  props: PropsSource<NoInfer<P>, E, R>,
  options: ViewOptions,
): Fx.Fx<RenderEvent, E | ReactRenderError, R | Scope.Scope | RenderTemplate>;

export function view<P extends object, E = never, R = never>(
  ...args:
    | [node: ReactNode, options: ViewOptions]
    | [component: ComponentType<P>, props: PropsSource<P, E, R>, options: ViewOptions]
): Fx.Fx<RenderEvent, E | ReactRenderError, R | Scope.Scope | RenderTemplate> {
  const nodes: Fx.Fx<ReactNode, E, R> =
    args.length === 2
      ? Fx.succeed(args[0])
      : Fx.map(sourceFx(args[1]), (value) => createElement(args[0], value));
  const settings = args.length === 2 ? args[1] : args[2];

  return Fx.gen(function* () {
    const scope = yield* Effect.scope;
    let target: HTMLElement | undefined;
    let hydrate = false;

    const ref = (element: HTMLElement) => {
      target = element;
    };

    const content = Fx.gen(function* () {
      if (target === undefined) {
        const renderer = yield* Effect.promise(() => import("./internal/Html.js"));

        return renderer.render(nodes, settings);
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

    return html`<div id=${settings.id} style="display:contents" ref=${ref}>${content}</div>`.pipe(
      Fx.provideService(Scope.Scope, scope),
      Fx.concatMap((event): Fx.Fx<RenderEvent, E | ReactRenderError, R> => {
        if (!isDomRenderEvent(event)) return Fx.succeed(event);

        const element = target;
        if (element === undefined)
          return Fx.die(new TypeError("React view requires a native host ref"));

        return Fx.gen(function* () {
          const renderer = yield* Effect.promise(() => import("./internal/Dom.js"));

          return renderer
            .render(element, event, nodes, settings, hydrate)
            .pipe(Fx.provideService(Scope.Scope, scope));
        });
      }),
    );
  });
}
