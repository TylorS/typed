import * as Effect from "effect/Effect"
import type * as Fiber from "effect/Fiber"
import * as Runtime from "effect/Runtime"
import type * as Scope from "effect/Scope"
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
  {
    readonly runtime: Runtime.Runtime<R | Scope.Scope>
    readonly scope: Scope.Scope
    readonly run: <E, A>(effect: Effect.Effect<A, E, R | Scope.Scope>) => Fiber.Fiber<A, E>
  },
  never,
  R | Scope.Scope
> {
  return Effect.gen(function*() {
    const runtime = yield* Effect.runtime<R | Scope.Scope>()
    const scope = yield* Effect.scope
    const runFork = Runtime.runFork(runtime)

    return {
      runtime,
      scope,
      run: (eff) => runFork(eff, { scope })
    } as const
  })
}
