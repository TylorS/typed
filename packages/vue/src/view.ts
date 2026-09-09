import * as Fx from "@typed/fx/Fx";
import type { RootEventOptions } from "@typed/template/RootEvents";
import { html, type RenderTemplate } from "@typed/template/RenderTemplate";
import { DomRenderEvent, isDomRenderEvent, type RenderEvent } from "@typed/template/RenderEvent";
import * as Effect from "effect/Effect";
import * as Scope from "effect/Scope";
import * as Cause from "effect/Cause";
import * as Deferred from "effect/Deferred";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import { rootIdentity } from "@typed/template/RootIdentity";
import { HydrateContext } from "@typed/template/HydrateContext";
import type * as Stream from "effect/Stream";
import type { App, Component, FunctionalComponent } from "vue";
import type { SSRContext } from "vue/server-renderer";

/** A whole props snapshot, optionally produced reactively. Functions in props remain functions. */
export type PropsSource<P, E = never, R = never> =
  | P
  | Effect.Effect<P, E, R>
  | Stream.Stream<P, E, R>
  | Fx.Fx<P, E, R>;

/** Public props accepted by a Vue SFC, defineComponent, or functional component. */
export type ComponentProps<C> = C extends abstract new (...args: any[]) => { $props: infer P }
  ? P
  : C extends FunctionalComponent<infer P>
    ? P
    : Record<string, unknown>;

/** Configuration is applied to a new app before mount, hydration, or server rendering. */
export interface ViewOptions {
  /** Optional host identity override. Generated per render and restored during hydration by default. */
  readonly id?: string;

  readonly configureApp?: (app: App) => void;

  /** Receives the request-local SSR context, including teleports, after server rendering. */
  readonly onSSRContext?: (context: SSRContext) => void | Promise<void>;

  /** Stop selected bubbling events at the automatic host; undefined inherits the context default. */
  readonly stopPropagation?: RootEventOptions;
}

/** A Vue mount, update, configuration, or server-rendering failure. */
export class VueError extends Error {
  readonly _tag = "VueError";

  constructor(
    readonly phase: "mount" | "update" | "server",
    cause: unknown,
  ) {
    super(`Vue ${phase} failed`, { cause });
  }
}

/** Embed Vue in Typed, retaining the props producer's failure and service channels. */
export function view<C extends Component, E = never, R = never>(
  component: C,
  props: PropsSource<ComponentProps<NoInfer<C>>, E, R>,
  options: ViewOptions = {},
): Fx.Fx<RenderEvent, E | VueError, R | Scope.Scope | RenderTemplate> {
  return Fx.gen(function* () {
    const identity = yield* rootIdentity(options.id);
    const scope = yield* Scope.fork(yield* Scope.Scope);
    const ready = yield* Deferred.make<void, E | VueError>();
    let published = false;

    let target: HTMLElement | undefined;

    const ref = (element: HTMLElement) => {
      target = element;
    };

    const content = Fx.gen(function* () {
      const settings = { ...options, id: yield* identity.id };
      if (target === undefined) {
        const backend = yield* Effect.tryPromise({
          try: () => import("./internal/html.js"),
          catch: (cause) => new VueError("server", cause),
        });

        return backend.renderVue(component, props, settings);
      }

      const hydration = Option.getOrUndefined(yield* Effect.serviceOption(HydrateContext));
      const hole = hydration?.where;
      const hydrate = hole?._tag === "hole";

      // Hand this exact child range to Vue. The DOM branch emits once, so Typed
      // never updates this range after Vue takes ownership of its children.
      if (hole?._tag === "hole") {
        hole.startComment.remove();
        hole.endComment.remove();
      }

      const element = target;
      const mount = Effect.tryPromise({
        try: () => import("./internal/dom.js"),
        catch: (cause) => new VueError("mount", cause),
      }).pipe(
        Effect.flatMap((backend) =>
          Layer.launch(backend.mountComponent(element, component, props, settings, ready, hydrate)),
        ),
        Effect.onExit((exit) =>
          Exit.isFailure(exit) ? Deferred.failCause(ready, exit.cause) : Effect.void,
        ),
      );

      return Fx.fromEffect(mount).pipe(Fx.prepend(DomRenderEvent([])));
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
      Fx.concatMap((event): Fx.Fx<RenderEvent, E | VueError> =>
        isDomRenderEvent(event)
          ? Fx.fromEffect(Deferred.await(ready)).pipe(
              Fx.map(() => {
                published = true;
                return event;
              }),
            )
          : Fx.succeed(event),
      ),
      Fx.onExit((exit) =>
        published && (Exit.isSuccess(exit) || Cause.hasInterruptsOnly(exit.cause))
          ? Effect.void
          : Scope.close(scope, exit),
      ),
      Fx.catchCause((cause) =>
        Cause.hasInterruptsOnly(cause) ? Fx.fromEffect(Effect.interrupt) : Fx.failCause(cause),
      ),
    );
  });
}
