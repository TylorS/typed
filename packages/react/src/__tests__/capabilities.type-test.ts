import type { ReactElement } from "react";
import { Context, Effect, Layer, ManagedRuntime, Option, Scope, Stream } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import * as Data from "@typed/async-data";
import * as Route from "@typed/router/Route";
import {
  prefetch,
  useAction,
  useAsyncData,
  useEffect,
  useFx,
  useRefSubject,
  useStream,
  type AsyncState,
} from "../Hooks.js";
import { fromContext, serviceContext, useService, type Runtime } from "../Runtime.js";
import { routeComponent, useRoute, type RouteOptions } from "../Router.js";

class Config extends Context.Service<Config, { readonly url: string }>()("types/Config") {}
class Other extends Context.Service<Other, { readonly name: string }>()("types/Other") {}
const runtime = ManagedRuntime.make(Layer.succeed(Config, { url: "/api" }));
const badRuntime = fromContext(Context.make(Other, { name: "other" }));
const source: Effect.Effect<number, "source-error", Config | Scope.Scope> = Effect.map(
  Config,
  () => 1,
);
const result: AsyncState<number, "source-error"> = useEffect(source, { runtime });
// @ts-expect-error Explicit runtime must supply the source's Config requirement.
useEffect(source, { runtime: badRuntime });
const scopedRuntime: Runtime<Config, never> = runtime;
void scopedRuntime;
const streamResult: AsyncState<string, "failed"> = useStream(
  Stream.fail("failed" as const) as Stream.Stream<string, "failed">,
);
const fxResult: AsyncState<number, "typed"> = useFx(
  Fx.fail("typed" as const) as Fx.Fx<number, "typed">,
);
const service: { readonly url: string } = useService(Config);
const ConfigContext = serviceContext(Config);
ConfigContext.Provider({ value: service });
// @ts-expect-error Effect service adapters retain the exact service implementation shape.
ConfigContext.Provider({ value: { url: 1 } });
const action = useAction((id: number) => Effect.succeed(String(id)));
const actionResult: Promise<import("effect/Exit").Exit<string>> = action.run(1);
// @ts-expect-error Action parameters retain their types.
action.run("1");
const stateRef = null as unknown as RefSubject.RefSubject<number, "write-error", Config>;
const state = useRefSubject(stateRef, { runtime });
const writeResult: Promise<import("effect/Exit").Exit<number, "write-error">> = state.set(1);
// @ts-expect-error RefSubject writes accept the subject's value type.
state.set("one");
const loaded: Effect.Effect<Data.AsyncData<number, "source-error">, never, Config> = prefetch(
  source,
);
const nested = null as unknown as Fx.Fx<Data.AsyncData<number, "request">, "stream", Config>;
const flattened: AsyncState<number, "request" | "stream"> = useAsyncData(nested, { runtime });
const Profile = (_props: { id: string }): ReactElement | null => null;
const handler: (params: RefSubject.RefSubject<{ id: string }>) => Fx.Fx.Any = routeComponent(
  Profile,
  { id: "profile" },
);
const params = useRoute(Route.Parse("/users/:id"));
const decoded: Option.Option<Option.Option<{ readonly id: string }>> = params.value;
void [
  result,
  streamResult,
  fxResult,
  actionResult,
  writeResult,
  loaded,
  flattened,
  handler,
  decoded,
];

const failingRuntime = null as unknown as Runtime<Config, "layer-error">;
const bothErrors: AsyncState<number, "source-error" | "layer-error"> = useEffect(source, {
  runtime: failingRuntime,
});
// @ts-expect-error Runtime and source failures cannot be silently erased.
const droppedErrors: AsyncState<number, never> = bothErrors;
void droppedErrors;

const routeOptions: RouteOptions<ReturnType<typeof Route.Parse<"/users/:id">>> = {
  currentRoute: { route: Route.Parse("/app"), parent: { route: Route.Slash } },
};
const rootedParams = useRoute(Route.Parse("/users/:id"), routeOptions);
const rootedDecoded: Option.Option<Option.Option<{ readonly id: string }>> = rootedParams.value;
// @ts-expect-error currentRoute is a structural CurrentRouteTree, not a string.
useRoute(Route.Parse("/users/:id"), { currentRoute: "/app" });
void rootedDecoded;
