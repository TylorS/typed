import { Schema } from "@effect/schema"
import * as Equivalence from "@effect/schema/Equivalence"
import * as RefSubject from "@typed/fx/RefSubject"
import { GetRandomValues, getRandomValues } from "@typed/id"
import type { Layer } from "effect"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import type * as Scope from "effect/Scope"
import type { Commit, InitialMemoryOptions, MemoryOptions } from "../Layer.js"
import { Navigation } from "../Navigation.js"
import type { ModelAndIntent } from "./shared.js"
import {
  getOriginFromUrl,
  getUrl,
  makeDestination,
  makeHandlersState,
  NavigationState,
  setupFromModelAndIntent
} from "./shared.js"

export const memory = (options: MemoryOptions): Layer.Layer<Navigation> =>
  Navigation.scoped(
    Effect.gen(function*() {
      const getRandomValues = yield* GetRandomValues
      const modelAndIntent = yield* setupMemory(options)
      const current = options.entries[options.currentIndex ?? 0]
      const origin = options.origin ?? getOriginFromUrl(current.url)
      const base = options.base ?? "/"

      return setupFromModelAndIntent(modelAndIntent, origin, base, getRandomValues)
    }).pipe(Effect.provide(getRandomValues))
  )

export function initialMemory(
  options: InitialMemoryOptions
): Layer.Layer<Navigation> {
  return Navigation.scoped(
    Effect.gen(function*() {
      const getRandomValues = yield* GetRandomValues
      const origin = options.origin ?? getOriginFromUrl(options.url)
      const base = options.base ?? "/"
      const destination = yield* makeDestination(getUrl(origin, options.url), options.state, origin)
      const memoryOptions: MemoryOptions = {
        entries: [destination],
        origin,
        base,
        currentIndex: 0,
        maxEntries: options.maxEntries
      }
      const modelAndIntent = yield* setupMemory(memoryOptions)

      return setupFromModelAndIntent(modelAndIntent, origin, base, getRandomValues)
    }).pipe(Effect.provide(getRandomValues))
  )
}

function setupMemory(
  options: MemoryOptions
): Effect.Effect<ModelAndIntent, never, GetRandomValues | Scope.Scope> {
  return Effect.gen(function*() {
    const state = yield* RefSubject.of<NavigationState>({
      entries: options.entries,
      index: options.currentIndex ?? options.entries.length - 1,
      transition: Option.none()
    }, { eq: Equivalence.make(Schema.typeSchema(NavigationState)) })

    const canGoBack = RefSubject.map(state, (s) => s.index > 0)
    const canGoForward = RefSubject.map(state, (s) => s.index < s.entries.length - 1)
    const { beforeHandlers, formDataHandlers, handlers } = yield* makeHandlersState()
    const commit: Commit = options.commit ?? (() => Effect.void)

    return {
      state,
      canGoBack,
      canGoForward,
      beforeHandlers,
      handlers,
      formDataHandlers,
      commit
    } as const
  })
}
