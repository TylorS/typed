/** @effect-diagnostics missingEffectError:skip-file */
import type * as AD from "@typed/async-data";
import type { Fx } from "@typed/fx/Fx";
import type * as Effect from "effect/Effect";
import type * as ManagedRuntime from "effect/ManagedRuntime";
import type * as Scope from "effect/Scope";
import type { Readable } from "svelte/store";
import type { AsyncState } from "../AsyncData.js";
import {
  prefetch,
  useAsyncData,
  useService,
  useSource,
  useRefSubject,
  type RefSubjectStore,
} from "../Reactive.js";
import type * as RefSubject from "@typed/fx/RefSubject";
import { Greeting } from "./fixtures/capabilities.js";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;
declare const runtime: ManagedRuntime.ManagedRuntime<Greeting, "runtime failed">;
declare const empty: ManagedRuntime.ManagedRuntime<never, never>;
declare const source: Fx<number, "source failed", Greeting | Scope.Scope>;
const observed = useSource(source, { runtime });
type _Source = Assert<
  Equal<typeof observed, AsyncState<number, "source failed" | "runtime failed">>
>;
// @ts-expect-error source application services must be supplied by an explicit runtime
useSource(source, { runtime: empty });
const service = useService(Greeting, { runtime });
type _Service = Assert<
  Equal<typeof service, AsyncState<{ readonly prefix: string }, "runtime failed">>
>;
declare const data: Readable<Fx<AD.AsyncData<number, "inner failed">, "outer failed", Greeting>>;
const flattened = useAsyncData(data, { runtime });
type _AsyncData = Assert<
  Equal<typeof flattened, AsyncState<number, "inner failed" | "outer failed" | "runtime failed">>
>;
const snapshot = prefetch(source);
type _Snapshot = Assert<
  Equal<Effect.Success<typeof snapshot>, AD.AsyncData<number, "source failed">>
>;
type _SnapshotServices = Assert<Equal<Effect.Services<typeof snapshot>, Greeting>>;
declare const failingRef: RefSubject.RefSubject<number, "read failed", Greeting>;
const writableRef = useRefSubject(failingRef, 0, { runtime });
type _WritableErrors = Assert<
  Equal<typeof writableRef, RefSubjectStore<number, "read failed" | "runtime failed">>
>;

import { useRoute, type RouteOptions } from "../Router.js";
import * as Route from "@typed/router/Route";
import type { CurrentRouteTree } from "@typed/router/CurrentRoute";
import type { Option } from "effect/Option";
import type { RouteNotFound, RouteDecodeError, RouteGuardError } from "@typed/router/Matcher";
const route = Route.Parse("/users/:id");
declare const routeRoot: Readable<CurrentRouteTree>;
const routeOptions: RouteOptions<typeof route> = { currentRoute: routeRoot };
const routed = useRoute(route, routeOptions);
type _RouteState = Assert<
  Equal<
    typeof routed,
    AsyncState<
      Option<Route.Route.Type<typeof route>>,
      RouteNotFound | RouteDecodeError | RouteGuardError
    >
  >
>;
useRoute(route, { currentRoute: { route: Route.Parse("/app") } });
// @ts-expect-error the root is a structural CurrentRouteTree, not a path string
useRoute(route, { currentRoute: "/app" });
