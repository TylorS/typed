import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Scope from "effect/Scope";
import type * as Cause from "effect/Cause";
import { toValue, watch, type MaybeRefOrGetter, type WatchSource } from "vue";
import type { VueRuntime } from "../Runtime.js";

/** A Vue-owned Scope, replaced with its dependencies and unavailable after disposal. */
function useScope(dependencies: ReadonlyArray<WatchSource>): () => Scope.Closeable | undefined {
  let current: Scope.Closeable | undefined;

  watch(
    dependencies,
    (_, __, onCleanup) => {
      const scope = (current = Scope.makeUnsafe());

      onCleanup(() => {
        current = undefined;
        Effect.runFork(Scope.close(scope, Exit.void));
      });
    },
    { immediate: true, flush: "sync" },
  );

  return () => current;
}

/** Run an Effect in the current Vue-owned scope, interrupting work after its dependencies change. */
export function useScopedRunner<R, ER = never>(
  runtime: MaybeRefOrGetter<VueRuntime<R, ER>>,
  dependencies: ReadonlyArray<WatchSource> = [],
) {
  const currentScope = useScope([...dependencies, () => toValue(runtime)]);

  return <A, E>(
    effect: Effect.Effect<A, E, R | Scope.Scope>,
    onCause?: (cause: Cause.Cause<E | ER>) => void,
  ) => {
    const scope = currentScope();
    if (!scope) return Promise.resolve(Exit.interrupt());

    return toValue(runtime)
      .runPromiseExit(
        Effect.suspend(() => (scope === currentScope() ? Effect.scoped(effect) : Effect.interrupt)),
        { onFiberStart: Fiber.runIn(scope) },
      )
      .then((exit) => {
        if (scope === currentScope() && Exit.isFailure(exit)) onCause?.(exit.cause);

        return exit;
      });
  };
}
