import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Runtime from '@effect/io/Runtime'
import * as Scope from '@effect/io/Scope'
import { History } from '@typed/dom'
import * as Fx from '@typed/fx'

import { Destination, NavigationError } from './Navigation.js'
import { DomIntent } from './dom-intent.js'

export type HistoryEvent = PushStateEvent | ReplaceStateEvent | GoEvent | BackEvent | ForwardEvent

export interface PushStateEvent {
  readonly _tag: 'PushState'
  readonly state: unknown
  readonly url: string
}

export interface ReplaceStateEvent {
  readonly _tag: 'ReplaceState'
  readonly state: unknown
  readonly url: string
}

export interface GoEvent {
  readonly _tag: 'Go'
  readonly delta: number
}

export interface BackEvent {
  readonly _tag: 'Back'
}

export interface ForwardEvent {
  readonly _tag: 'Forward'
}

export const patchHistory: Effect.Effect<
  History | Scope.Scope,
  never,
  readonly [History, Fx.Subject<never, HistoryEvent>]
> = Effect.gen(function* ($) {
  const history = yield* $(History)

  const stateDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(history), 'state')

  // Create a clone that always operates on the original history
  const clone: History = {
    get length() {
      return history.length
    },
    get scrollRestoration() {
      return history.scrollRestoration
    },
    set scrollRestoration(value) {
      history.scrollRestoration = value
    },
    get state() {
      return stateDescriptor?.get?.call(history)
    },
    back: history.back.bind(history),
    forward: history.forward.bind(history),
    go: history.go.bind(history),
    pushState: history.pushState.bind(history),
    replaceState: history.replaceState.bind(history),
  }

  const scope = yield* $(Effect.scope)
  const historyEvents = Fx.makeSubject<never, HistoryEvent>()
  const runtime = yield* $(Effect.runtime<never>())
  const runFork = Runtime.runFork(runtime)
  const cleanup = patchHistory_(history, (event: HistoryEvent) =>
    runFork(Effect.flatMap(Effect.forkIn(historyEvents.event(event), scope), Fiber.join)),
  )

  // unpatch history upon finalization
  yield* $(Effect.addFinalizer(() => Effect.sync(cleanup)))

  return [clone, historyEvents]
})

function patchHistory_(history: History, sendEvent: (event: HistoryEvent) => void) {
  const pushState = history.pushState
  const replaceState = history.replaceState
  const go = history.go
  const back = history.back
  const forward = history.forward

  history.pushState = function (state, _, url) {
    if (url) sendEvent({ _tag: 'PushState', state, url: url.toString() })
  }

  history.replaceState = function (state, _, url) {
    if (url) sendEvent({ _tag: 'ReplaceState', state, url: url.toString() })
  }

  history.go = function (delta) {
    if (!delta) return

    sendEvent({ _tag: 'Go', delta })
  }

  history.back = function () {
    sendEvent({ _tag: 'Back' })
  }

  history.forward = function () {
    sendEvent({ _tag: 'Forward' })
  }

  const stateDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(history), 'state')

  // Override state to always return the original state
  Object.defineProperty(history, 'state', {
    get() {
      const state = stateDescriptor?.get?.call(history)

      if (state && state.key && state.state) return state.state

      return state
    },
  })

  // Reset history to original state
  return () => {
    history.pushState = pushState
    history.replaceState = replaceState
    history.go = go
    history.back = back
    history.forward = forward

    if (stateDescriptor) {
      Object.defineProperty(history, 'state', stateDescriptor)
    }
  }
}

export function onHistoryEvent(
  event: HistoryEvent,
  intent: DomIntent,
): Effect.Effect<
  History | Location | Storage,
  Cause.NoSuchElementException | NavigationError,
  Destination
> {
  return Effect.gen(function* ($) {
    switch (event._tag) {
      case 'PushState':
        return yield* $(intent.push(event.url, { state: event.state }, true))
      case 'ReplaceState':
        return yield* $(intent.replace(event.url, { state: event.state }, true))
      case 'Back':
        return yield* $(intent.back(true))
      case 'Forward':
        return yield* $(intent.forward(true))
      case 'Go':
        return yield* $(intent.go(event.delta, true))
    }
  })
}
