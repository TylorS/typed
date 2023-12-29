import * as Effect from "effect/Effect"
import * as ExecutionStrategy from "effect/ExecutionStrategy"
import * as Fiber from "effect/Fiber"
import * as Runtime from "effect/Runtime"
import * as Scope from "effect/Scope"
import type * as TQS from "typed-query-selector/parser"

export type ParseSelector<T extends string, Fallback> = [T] extends [typeof ROOT_CSS_SELECTOR] ? Fallback
  : Fallback extends globalThis.Element ? TQS.ParseSelector<T, Fallback>
  : Fallback

export type DefaultEventMap<T> = T extends Window ? WindowEventMap
  : T extends Document ? DocumentEventMap
  : T extends HTMLVideoElement ? HTMLVideoElementEventMap
  : T extends HTMLMediaElement ? HTMLMediaElementEventMap
  : T extends HTMLElement ? HTMLElementEventMap
  : T extends SVGElement ? SVGElementEventMap
  : T extends Element ? ElementEventMap
  : Readonly<Record<string, unknown>>

export const ROOT_CSS_SELECTOR = `:root` as const
export type ROOT_CSS_SELECTOR = typeof ROOT_CSS_SELECTOR

export function createScopedRuntime<R>(): Effect.Effect<
  R | Scope.Scope,
  never,
  {
    readonly runtime: Runtime.Runtime<R | Scope.Scope>
    readonly scope: Scope.Scope
    readonly run: <E, A>(effect: Effect.Effect<R | Scope.Scope, E, A>) => Fiber.Fiber<E, A>
  }
> {
  return Effect.gen(function*(_) {
    const runtime = yield* _(Effect.runtime<R | Scope.Scope>())
    const scope = yield* _(Effect.scope)
    const runFork = Runtime.runFork(runtime)

    const run = <E, A>(effect: Effect.Effect<R | Scope.Scope, E, A>): Fiber.Fiber<E, A> => {
      const fiber: Fiber.Fiber<E, A> = Scope.fork(scope, ExecutionStrategy.sequential).pipe(
        Effect.flatMap((childScope) =>
          Effect.zipRight(
            Scope.addFinalizer(
              childScope,
              Effect.suspend(() => fiber ? Fiber.interrupt(fiber) : Effect.unit)
            ),
            Effect.onExit(effect, (exit) => Scope.close(childScope, exit))
          )
        ),
        runFork
      )

      return fiber
    }

    return {
      runtime,
      scope,
      run
    } as const
  })
}
