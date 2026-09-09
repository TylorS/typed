import * as Cause from "effect/Cause";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Scope from "effect/Scope";
import * as Fx from "@typed/fx/Fx";
import {
  DomRenderEvent,
  HtmlRenderEvent,
  isDomRenderEvent,
  type RenderEvent,
} from "@typed/template/RenderEvent";
import { rootIdentity } from "@typed/template/RootIdentity";
import { HydrateContext } from "@typed/template/HydrateContext";
import { html, type RenderTemplate } from "@typed/template/RenderTemplate";
import type { Component } from "svelte";
import { toFx, type Source } from "./Source.js";
import type { ViewOptions } from "./ViewOptions.js";

export type { ViewOptions } from "./ViewOptions.js";

/** A native Typed template that mounts or serializes a Svelte component. */
export function view<Props extends Record<string, any>, E = never, R = never>(
  component: Component<Props>,
  props: Source<NoInfer<Props>, E, R>,
  options: ViewOptions = {},
): Fx.Fx<RenderEvent, E, R | Scope.Scope | RenderTemplate> {
  return Fx.gen(function* () {
    const identity = yield* rootIdentity(options.id);
    const source = toFx(props);
    const scope = yield* Scope.fork(yield* Effect.scope);
    const ready = yield* Deferred.make<void, E>();
    let published = false;

    let target: HTMLElement | undefined;
    const ref = (element: HTMLElement) => {
      target = element;
    };

    const content = Fx.gen(function* () {
      const settings = { ...options, id: yield* identity.id };
      if (target === undefined) {
        const { render } = yield* Effect.promise(() => import("./internal/Html.js"));
        return Fx.fromEffect(render(component, source, settings)).pipe(
          Fx.map((html) => HtmlRenderEvent(html, true)),
        );
      }

      const hydration = yield* Effect.serviceOption(HydrateContext);
      const hydrate = Option.isSome(hydration) && hydration.value.where._tag === "hole";
      if (hydrate) {
        // Transfer the exact marker-owned range to Svelte, then publish one DOM event for the host.
        hydration.value.where.startComment.remove();
        hydration.value.where.endComment.remove();
      }

      const element = target;
      const mount = Effect.promise(() => import("./internal/Dom.js")).pipe(
        Effect.flatMap(({ mountComponent }) =>
          Layer.launch(mountComponent(element, component, source, settings, ready, hydrate)),
        ),
        Effect.onExit((exit) => Deferred.done(ready, exit)),
      );
      return Fx.fromEffect(mount).pipe(Fx.prepend(DomRenderEvent([])));
    });

    return html`<div
      ...${{ ref: identity.ref }}
      id=${identity.id}
      style="display: contents"
      ref=${ref}
    >
      ${content}
    </div>`.pipe(
      Fx.provideService(Scope.Scope, scope),
      Fx.concatMap((event): Fx.Fx<RenderEvent, E, R> =>
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
