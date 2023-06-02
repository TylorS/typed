import * as Option from '@effect/data/Option'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'

import { Destination, NavigationError, NavigationEvent, OnNavigationOptions } from './Navigation.js'
import { Model } from './model.js'

export type Notify = (event: NavigationEvent) => Effect.Effect<never, NavigationError, void>

export type Save<R> = (
  event: NavigationEvent,
) => Effect.Effect<R, Cause.NoSuchElementException, void>

// Anytime there are changes to the model, we need to notify all event handlers
export const makeNotify = (model: Model) => (event: NavigationEvent) =>
  Effect.gen(function* ($) {
    // Notify event handlers
    if (model.eventHandlers.size > 0)
      yield* $(
        Effect.forEachDiscard(model.eventHandlers, ([handler, options]) =>
          options?.passive ? Effect.fork(handler(event)) : handler(event),
        ),
      )
  })

export const makeOnNavigation =
  (model: Model) =>
  <R>(
    handler: (event: NavigationEvent) => Effect.Effect<R, NavigationError, unknown>,
    options?: OnNavigationOptions,
  ): Effect.Effect<R | Scope.Scope, NavigationError | Cause.NoSuchElementException, void> =>
    Effect.uninterruptibleMask((restore) =>
      Effect.gen(function* ($) {
        const context = yield* $(Effect.context<R>())
        const handler_ = (event: NavigationEvent) =>
          restore(Effect.provideContext(handler(event), context))
        const entry = [handler_, options] as const

        model.eventHandlers.add(entry)

        yield* $(Effect.addFinalizer(() => Effect.sync(() => model.eventHandlers.delete(entry))))

        // Send the latest navigation event on subscription
        const events = yield* $(model.events)
        const index = yield* $(model.index)
        const event = events[index]

        yield* $(restore(handler(event)))
      }),
    )

export const makeGoTo =
  <R, E>(
    model: Model,
    go: (delta: number, skipHistory?: boolean) => Effect.Effect<R, E, Destination>,
  ) =>
  (key: string): Effect.Effect<R, Cause.NoSuchElementException | E, Option.Option<Destination>> =>
    Effect.gen(function* ($) {
      const entries = yield* $(model.entries)
      const currentIndex = yield* $(model.index)
      const nextIndex = entries.findIndex((destination) => destination.key === key)

      if (nextIndex === -1) return Option.none()

      const delta = nextIndex - currentIndex

      if (delta !== 0) {
        return Option.some(yield* $(go(delta)))
      }

      return Option.some(entries[nextIndex])
    })
