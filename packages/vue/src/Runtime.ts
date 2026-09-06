import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import type { ManagedRuntime } from "effect/ManagedRuntime";
import {
  computed,
  getCurrentInstance,
  inject,
  provide,
  shallowRef,
  toValue,
  type App,
  type ComponentInternalInstance,
  type InjectionKey,
  type MaybeRefOrGetter,
  type ShallowRef,
} from "vue";

/** Execution borrowed from an application/request owner; Vue never disposes its runtime. */
export type VueRuntime<R = never, E = never> = Pick<
  ManagedRuntime<R, E>,
  "runFork" | "runPromiseExit"
>;
export type RuntimeRef<R = never, E = never> = Readonly<ShallowRef<VueRuntime<R, E>>>;

/** Vue injection erases service types; explicit runtime options retain them at call sites. */
export const RuntimeKey: InjectionKey<RuntimeRef<any, any>> = Symbol("@typed/vue/Runtime");
const localRuntimes = new WeakMap<ComponentInternalInstance, RuntimeRef<any, any>>();

/** Adapt an Effect context without allocating or taking ownership of a runtime. */
export function fromContext<R>(context: Context.Context<R>): VueRuntime<R> {
  return {
    runFork: Effect.runForkWith(context),
    runPromiseExit: Effect.runPromiseExitWith(context),
  };
}

/** Install once per Vue app or SSR request. Reactive replacements flow to descendants. */
export function installRuntime<R, E>(app: App, runtime: MaybeRefOrGetter<VueRuntime<R, E>>): App {
  return app.provide(
    RuntimeKey,
    computed(() => toValue(runtime)),
  );
}

/** Override execution for this component and its descendants during setup. */
export function provideRuntime<R, E>(
  runtime: MaybeRefOrGetter<VueRuntime<R, E>>,
): RuntimeRef<R, E> {
  const instance = getCurrentInstance();
  if (!instance) throw new Error("provideRuntime must run inside Vue setup");

  const value = computed(() => toValue(runtime));
  localRuntimes.set(instance, value);
  provide(RuntimeKey, value);

  return value;
}

/** Read a provider, or use ordinary Effect execution for service-free components. */
export function useRuntime<R = never, E = never>(): RuntimeRef<R, E> {
  const instance = getCurrentInstance();
  const runtime = instance
    ? (localRuntimes.get(instance) ?? inject(RuntimeKey, undefined))
    : undefined;

  // The fallback owns no services or application state; missing services remain Effect failures.
  return runtime ?? shallowRef(fromContext(Context.empty() as Context.Context<R>));
}

/** Shadow selected services, preserving all other services and the runtime's ownership. */
export function withServices<R, E, R2>(
  runtime: VueRuntime<R, E>,
  services: Context.Context<R2>,
): VueRuntime<R | R2, E> {
  return {
    runFork: (effect, options) => runtime.runFork(Effect.provideContext(effect, services), options),
    runPromiseExit: (effect, options) =>
      runtime.runPromiseExit(Effect.provideContext(effect, services), options),
  };
}

/** Provide reactive service overrides to this component and its descendants. */
export function provideServices<R2, R = never, E = never>(
  services: MaybeRefOrGetter<Context.Context<R2>>,
): RuntimeRef<R | R2, E> {
  const parent = useRuntime<R, E>();

  return provideRuntime(computed(() => withServices(parent.value, toValue(services))));
}
