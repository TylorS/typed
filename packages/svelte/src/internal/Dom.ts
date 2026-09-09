import * as Effect from "effect/Effect";
import * as Deferred from "effect/Deferred";
import * as Layer from "effect/Layer";
import * as Fx from "@typed/fx/Fx";
import { hydrate as hydrateComponent, mount, tick, unmount, type Component } from "svelte";
import { writable } from "svelte/store";
import { rootEvents } from "@typed/template/RootEvents";
import { fromContext, runtimeContext } from "../Runtime.js";
import type { ViewOptions } from "../ViewOptions.js";
import Bridge from "./Bridge.client.js";

export const mountComponent = Effect.fn(function* <Props extends Record<string, any>, E, R>(
  element: HTMLElement,
  component: Component<Props>,
  props: Fx.Fx<Props, E, R>,
  options: ViewOptions,
  ready: Deferred.Deferred<void, E>,
  hydrate: boolean,
) {
  yield* rootEvents(element, options.stopPropagation);

  const services = yield* Effect.context<R>();
  const context = new Map([...runtimeContext(fromContext(services)), ...(options.context ?? [])]);

  let instance: Record<string, any> | undefined;
  let values: ReturnType<typeof writable<Props>> | undefined;
  const committed = yield* Deferred.make<void>();

  yield* Effect.addFinalizer(() =>
    Effect.suspend(() => {
      const mounted = instance;

      return mounted === undefined
        ? Effect.void
        : Effect.promise(() => unmount(mounted, { outro: options.outro }));
    }),
  );

  const update = Effect.fn(function* (next: Props) {
    if (values !== undefined) {
      const store = values;
      yield* Deferred.await(committed);

      return yield* Effect.sync(() => store.set(next));
    }

    values = writable(next);
    const common = {
      target: element,
      props: { component, values },
      context,
      intro: options.intro,
      transformError: options.transformError,
      recover: options.recover,
    };

    instance = hydrate ? hydrateComponent(Bridge<Props>, common) : mount(Bridge<Props>, common);

    // Publication follows native Typed ref timing; Svelte schedules its own commit.
    yield* Deferred.succeed(ready, undefined);
    yield* Effect.promise(tick).pipe(Effect.onExit((exit) => Deferred.done(committed, exit)));
  });

  return yield* Fx.observe(props, update).pipe(Effect.andThen(Deferred.succeed(ready, undefined)));
}, Layer.effectDiscard);
