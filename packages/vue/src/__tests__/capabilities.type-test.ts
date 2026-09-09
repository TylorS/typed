import { RandomValues } from "@typed/id/RandomValues";
/** @effect-diagnostics missingEffectContext:skip-file */
import * as Data from "@typed/async-data";
import * as Fx from "@typed/fx/Fx";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import type * as Option from "effect/Option";
import type * as Schema from "effect/Schema";
import type * as Scope from "effect/Scope";
import * as Stream from "effect/Stream";
import type * as Route from "@typed/router/Route";
import { Parse } from "@typed/router/Route";
import { match } from "@typed/router/Matcher";
import type { Router } from "@typed/router/Router";
import type { RenderEvent } from "@typed/template/RenderEvent";
import type { RenderTemplate } from "@typed/template/RenderTemplate";
import type { VueError } from "../view.js";
import type * as RefSubject from "@typed/fx/RefSubject";
import { expectTypeOf } from "vitest";
import { defineComponent, shallowRef, type ComputedRef } from "vue";
import { prefetch, useEffect, useFx, useService, useStream, type AsyncState } from "../Reactive.js";
import { fromContext, type VueRuntime } from "../Runtime.js";
import { routeComponent, useRoute, type RouteOptions } from "../Router.js";

class Service extends Context.Service<Service, { readonly name: string }>()("vue-types/Service") {}
declare const runtime: VueRuntime<Service, "runtime-failed">;
const program = Effect.flatMap(Service, () => Effect.fail("request-failed" as const));
const result = useEffect(program, { runtime });
const borrowed: VueRuntime<Service, "runtime-failed"> = {
  runFork: runtime.runFork,
  runPromiseExit: runtime.runPromiseExit,
};
useEffect(program, { runtime: borrowed });
expectTypeOf(result).toEqualTypeOf<AsyncState<never, "runtime-failed" | "request-failed">>();
expectTypeOf(result.error).toEqualTypeOf<
  ComputedRef<Option.Option<"runtime-failed" | "request-failed">>
>();
expectTypeOf(useService(Service, { runtime }).value).toEqualTypeOf<
  ComputedRef<Option.Option<{ readonly name: string }>>
>();
expectTypeOf(useStream(Stream.make(1, 2))).toEqualTypeOf<AsyncState<1 | 2, never>>();
expectTypeOf(useFx(Fx.succeed("value"))).toEqualTypeOf<AsyncState<string, never>>();
expectTypeOf(prefetch(program)).toEqualTypeOf<
  Effect.Effect<Data.AsyncData<never, "request-failed">, never, Service>
>();
useEffect(shallowRef(Effect.succeed(1)), { runtime: fromContext(Context.empty()) });
// @ts-expect-error An explicit runtime must satisfy the source's required services.
useEffect(program, { runtime: fromContext(Context.empty()) });
// @ts-expect-error A source cannot be an arbitrary Vue ref value.
useFx(shallowRef(42));
declare const serviceRoute: Route.Route<
  "/:id",
  Schema.Codec<{ readonly id: string }, { readonly id: string }, Service>
>;
declare const routerRuntime: VueRuntime<Router>;
declare const fullRuntime: VueRuntime<Router | Service>;
useRoute(serviceRoute, { runtime: fullRuntime });
// @ts-expect-error Route schema decoding dependencies must be present in an explicit runtime.
useRoute(serviceRoute, { runtime: routerRuntime });
const Page = defineComponent({ props: { id: { type: String, required: true } } });
const routeHandler = routeComponent(Page, { id: "typed-page" });
declare const routeParams: RefSubject.RefSubject<{ readonly id: string }>;
routeHandler(routeParams);
expectTypeOf(routeHandler(routeParams)).toEqualTypeOf<
  Fx.Fx<RenderEvent, VueError, Scope.Scope | RenderTemplate | RandomValues | RandomValues>
>();
const matchedPage = match(Parse("/users/:id"), routeHandler);
expectTypeOf<Fx.Fx.Success<typeof matchedPage>>().toEqualTypeOf<RenderEvent>();
routeComponent(Page);

declare const selectedRoot: import("@typed/router/CurrentRoute").CurrentRouteTree;
const routeOptions: RouteOptions<typeof serviceRoute> = {
  runtime: fullRuntime,
  currentRoute: shallowRef(selectedRoot),
};
useRoute(serviceRoute, routeOptions);
useRoute(serviceRoute, { runtime: fullRuntime, currentRoute: () => selectedRoot });
// @ts-expect-error Explicit roots retain route-schema decoding service requirements.
useRoute(serviceRoute, { runtime: routerRuntime, currentRoute: selectedRoot });
// @ts-expect-error Route roots require the structural CurrentRouteTree contract.
useRoute(serviceRoute, { runtime: fullRuntime, currentRoute: "/app" });
expectTypeOf(
  useRoute(Parse("/users/:id"), { runtime: routerRuntime, currentRoute: selectedRoot }).value,
).toEqualTypeOf<ComputedRef<Option.Option<Option.Option<{ readonly id: string }>>>>();
