import * as RefSubject from "@typed/fx/RefSubject"
import { GetRandomValues, getRandomValues } from "@typed/id"
import { Effect, Option } from "effect"
import type { Layer, Scope } from "effect"
import type { Commit, InitialMemoryOptions, MemoryOptions } from "../Layer"
import { Navigation } from "../Navigation"
import type { ModelAndIntent, NavigationState } from "./shared.js"
import { getOriginFromUrl, getUrl, makeDestination, makeHandlersState, setupFromModelAndIntent } from "./shared.js"

export const memory = (options: MemoryOptions): Layer.Layer<never, never, Navigation> =>
  Navigation.scoped(
    Effect.gen(function*(_) {
      const getRandomValues = yield* _(GetRandomValues)
      const modelAndIntent = yield* _(setupMemory(options))
      const current = options.entries[options.currentIndex ?? 0]
      const origin = options.origin ?? getOriginFromUrl(current.url)
      const base = options.base ?? "/"

      return setupFromModelAndIntent(modelAndIntent, origin, base, getRandomValues)
    }).pipe(Effect.provide(getRandomValues))
  )

export function initialMemory(
  options: InitialMemoryOptions
): Layer.Layer<never, never, Navigation> {
  return Navigation.scoped(
    Effect.gen(function*(_) {
      const getRandomValues = yield* _(GetRandomValues)
      const origin = options.origin ?? getOriginFromUrl(options.url)
      const base = options.base ?? "/"
      const destination = yield* _(makeDestination(getUrl(origin, options.url), options.state, origin))
      const memoryOptions: MemoryOptions = {
        entries: [destination],
        origin,
        base,
        currentIndex: 0,
        maxEntries: options.maxEntries
      }
      const modelAndIntent = yield* _(setupMemory(memoryOptions))

      return setupFromModelAndIntent(modelAndIntent, origin, base, getRandomValues)
    }).pipe(Effect.provide(getRandomValues))
  )
}

function setupMemory(
  options: MemoryOptions
): Effect.Effect<
  GetRandomValues | Scope.Scope,
  never,
  ModelAndIntent
> {
  return Effect.gen(function*(_) {
    const state = yield* _(
      RefSubject.fromEffect(
        Effect.sync((): NavigationState => {
          return {
            entries: options.entries,
            index: options.currentIndex ?? options.entries.length - 1,
            transition: Option.none()
          }
        })
      )
    )
    const canGoBack = state.map((s) => s.index > 0)
    const canGoForward = state.map((s) => s.index < s.entries.length - 1)
    const { beforeHandlers, handlers } = yield* _(makeHandlersState())
    const commit: Commit = options.commit ?? (() => Effect.unit)

    return {
      state,
      canGoBack,
      canGoForward,
      beforeHandlers,
      handlers,
      commit
    } as const
  })
}
