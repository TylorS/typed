import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Fx from "@typed/fx/Fx";
import { type Component } from "svelte";
import { readable } from "svelte/store";
import { fromContext, runtimeContext } from "../Runtime.js";
import type { ViewOptions } from "../ViewOptions.js";
import Bridge from "./Bridge.server.js";

export const render = Effect.fn(function* <Props extends Record<string, any>, E, R>(
  component: Component<Props>,
  props: Fx.Fx<Props, E, R>,
  options: ViewOptions,
) {
  const initial = yield* Fx.first(props);
  if (Option.isNone(initial)) return "";

  const services = yield* Effect.context<Fx.Services<typeof props>>();
  const output = yield* Effect.promise(async () => {
    const { render } = await import("svelte/server");
    const values = readable(initial.value);

    return await render(Bridge<Props>, {
      props: { component, values },
      context: new Map([...runtimeContext(fromContext(services)), ...(options.context ?? [])]),
      idPrefix: options.idPrefix ?? options.id,
      csp: options.csp,
      transformError: options.transformError,
    });
  });

  options.onHead?.(output.head);
  return output.body;
});
