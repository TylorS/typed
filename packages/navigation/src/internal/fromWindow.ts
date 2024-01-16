import * as Equivalence from "@effect/schema/Equivalence"
import { unsafeGet } from "@typed/context"
import { Window } from "@typed/dom/Window"
import * as RefSubject from "@typed/fx/RefSubject"
import { GetRandomValues, Uuid } from "@typed/id"

import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import type * as Fiber from "effect/Fiber"
import * as Option from "effect/Option"
import * as Runtime from "effect/Runtime"
import * as Scope from "effect/Scope"

import { Schema } from "@effect/schema"
import type { Layer } from "effect"
import type { Commit } from "../Layer.js"
import type { BeforeNavigationEvent, Destination, NavigationEvent, Transition } from "../Navigation.js"
import { Navigation, NavigationError } from "../Navigation.js"
import type { ModelAndIntent } from "./shared.js"
import {
  getOriginalState,
  getUrl,
  isPatchedState,
  makeDestination,
  makeHandlersState,
  NavigationState,
  setupFromModelAndIntent
} from "./shared.js"

/* eslint-disable @typescript-eslint/consistent-type-imports */
type NativeNavigation = import("@virtualstate/navigation").Navigation
type NativeEntry = import("@virtualstate/navigation").NavigationHistoryEntry
type NativeEvent = import("@virtualstate/navigation").NavigationEventMap["navigate"]
/* eslint-enable @typescript-eslint/consistent-type-imports */

declare global {
  export interface Window {
    navigation?: NativeNavigation
  }
}

export const fromWindow: Layer.Layer<Window, never, Navigation> = Navigation.scoped(
  Window.withEffect((window) => {
    const getRandomValues = (length: number) => Effect.sync(() => window.crypto.getRandomValues(new Uint8Array(length)))
    return Effect.gen(function*(_) {
      const { run, runPromise } = yield* _(scopedRuntime<never>())
      const hasNativeNavigation = !!window.navigation
      const modelAndIntent = yield* _(
        hasNativeNavigation
          ? setupWithNavigation(window.navigation!, runPromise)
          : setupWithHistory(window, (event) => run(handleHistoryEvent(event)))
      )

      const navigation = setupFromModelAndIntent(
        modelAndIntent,
        window.location.origin,
        getBaseHref(window),
        getRandomValues,
        hasNativeNavigation ? () => getNavigationState(window.navigation!) : undefined
      )

      return navigation

      function handleHistoryEvent(event: HistoryEvent) {
        return Effect.gen(function*(_) {
          if (event._tag === "PushState") {
            return yield* _(navigation.navigate(event.url, {}, event.skipCommit))
          } else if (event._tag === "ReplaceState") {
            if (Option.isSome(event.url)) {
              return yield* _(
                navigation.navigate(event.url.value, { history: "replace", state: event.state }, event.skipCommit)
              )
            } else {
              return yield* _(navigation.updateCurrentEntry(event))
            }
          } else if (event._tag === "Traverse") {
            const { entries, index } = yield* _(modelAndIntent.state)
            const toIndex = Math.min(Math.max(0, index + event.delta), entries.length - 1)
            const to = entries[toIndex]

            return yield* _(navigation.traverseTo(to.key, {}, event.skipCommit))
          } else {
            yield* _(navigation.traverseTo(event.key, {}, event.skipCommit))
            return yield* _(navigation.updateCurrentEntry({ state: event.state }))
          }
        })
      }
    }).pipe(
      GetRandomValues.provide(getRandomValues)
    )
  })
)

function getBaseHref(window: Window) {
  const base = window.document.querySelector("base")
  return base ? base.href : "/"
}

const getNavigationState = (navigation: NativeNavigation): NavigationState => {
  const entries = navigation.entries().map(nativeEntryToDestination)
  const { index } = navigation.currentEntry

  return {
    entries,
    index,
    transition: Option.none<Transition>()
  }
}

function setupWithNavigation(
  navigation: NativeNavigation,
  runPromise: <E, A>(effect: Effect.Effect<Scope.Scope, E, A>) => Promise<A>
): Effect.Effect<
  Scope.Scope | GetRandomValues,
  never,
  ModelAndIntent
> {
  return Effect.gen(function*(_) {
    const state = yield* _(
      RefSubject.fromEffect(
        Effect.sync((): NavigationState => getNavigationState(navigation)),
        { eq: Equivalence.make(Schema.to(Schema.to(NavigationState))) }
      )
    )
    const canGoBack = RefSubject.map(state, (s) => s.index > 0)
    const canGoForward = RefSubject.map(state, (s) => s.index < s.entries.length - 1)
    const { beforeHandlers, handlers } = yield* _(makeHandlersState())
    const commit: Commit = (to: Destination, event: BeforeNavigationEvent) =>
      Effect.gen(function*(_) {
        const { key, state, url } = to
        const { info, type } = event

        if (type === "push" || type === "replace") {
          yield* _(
            Effect.promise(() => navigation.navigate(url.toString(), { history: type, state, info }).committed),
            Effect.catchAllDefect((error) => Effect.fail(new NavigationError({ error })))
          )
        } else if (event.type === "reload") {
          yield* _(
            Effect.promise(() => navigation.reload({ state, info }).committed),
            Effect.catchAllDefect((error) => Effect.fail(new NavigationError({ error })))
          )
        } else {
          yield* _(
            Effect.promise(() => navigation.traverseTo(key, { info }).committed),
            Effect.catchAllDefect((error) => Effect.fail(new NavigationError({ error })))
          )
        }
      })

    const runHandlers = (native: NativeEvent) =>
      Effect.gen(function*(_) {
        const eventHandlers = yield* _(handlers)
        const matches: Array<Effect.Effect<never, never, unknown>> = []

        const event: NavigationEvent = {
          type: native.navigationType,
          destination: nativeEntryToDestination(navigation.currentEntry),
          info: native.info
        }

        for (const [handler, ctx] of eventHandlers) {
          const match = yield* _(handler(event), Effect.provide(ctx))
          if (Option.isSome(match)) {
            matches.push(Effect.provide(match.value, ctx))
          }
        }

        if (matches.length > 0) {
          yield* _(Effect.all(matches))
        }
      })

    navigation.addEventListener("navigate", (ev) => {
      if (shouldNotIntercept(ev)) return

      ev.intercept({
        handler: () => runPromise(runHandlers(ev))
      })
    })

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

function nativeEntryToDestination(
  entry: Pick<NativeEntry, "id" | "key" | "url" | "getState" | "sameDocument">
): Destination {
  return {
    id: Uuid(entry.id),
    key: Uuid(entry.key),
    url: new URL(entry.url!),
    state: entry.getState(),
    sameDocument: entry.sameDocument
  }
}

function shouldNotIntercept(navigationEvent: NativeEvent): boolean {
  return (
    !navigationEvent.canIntercept ||
    // If this is just a hashChange,
    // just let the browser handle scrolling to the content.
    navigationEvent.hashChange ||
    // If this is a download,
    // let the browser perform the download.
    !!navigationEvent.downloadRequest ||
    // If this is a form submission,
    // let that go to the server.
    !!navigationEvent.formData
  )
}

function setupWithHistory(
  window: Window,
  onEvent: (event: HistoryEvent) => void
): Effect.Effect<
  GetRandomValues | Scope.Scope,
  never,
  ModelAndIntent
> {
  return Effect.gen(function*(_) {
    const { location } = window
    const { original: history, unpatch } = patchHistory(window, onEvent)

    yield* _(Effect.addFinalizer(() => unpatch))

    const state = yield* _(
      RefSubject.fromEffect(
        Effect.suspend(() =>
          Effect.map(
            makeDestination(
              new URL(location.href),
              history.state,
              location.origin
            ),
            (destination): NavigationState => ({ entries: [destination], index: 0, transition: Option.none() })
          )
        ),
        { eq: Equivalence.make(Schema.to(NavigationState)) }
      )
    )
    const canGoBack = RefSubject.map(state, (s) => s.index > 0)
    const canGoForward = RefSubject.map(state, (s) => s.index < s.entries.length - 1)
    const { beforeHandlers, handlers } = yield* _(makeHandlersState())
    const commit: Commit = ({ id, key, state, url }: Destination, event: BeforeNavigationEvent) =>
      Effect.sync(() => {
        const { type } = event

        if (type === "push") {
          history.pushState({ id, key, originalHistoryState: state }, "", url)
        } else if (type === "replace") {
          history.replaceState({ id, key, originalHistoryState: state }, "", url)
        } else if (event.type === "reload") {
          location.reload()
        } else {
          history.go(event.delta)
        }
      })

    return {
      state,
      canGoBack,
      canGoForward,
      beforeHandlers,
      handlers,
      commit
    } as ModelAndIntent
  })
}

type HistoryEvent = PushStateEvent | ReplaceStateEvent | TraverseEvent | TraverseToEvent

type PushStateEvent = { _tag: "PushState"; state: unknown; url: URL; skipCommit: boolean }
type ReplaceStateEvent = { _tag: "ReplaceState"; state: unknown; url: Option.Option<URL>; skipCommit: boolean }
type TraverseEvent = { _tag: "Traverse"; delta: number; skipCommit: boolean }
type TraverseToEvent = { _tag: "TraverseTo"; key: Uuid; state: unknown; skipCommit: boolean }

function patchHistory(window: Window, onEvent: (event: HistoryEvent) => void) {
  const { history, location } = window
  const stateDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(history), "state")

  const methods = {
    pushState: history.pushState.bind(history),
    replaceState: history.replaceState.bind(history),
    go: history.go.bind(history),
    back: history.back.bind(history),
    forward: history.forward.bind(history)
  }
  const getState = stateDescriptor?.get?.bind(history)

  const original: History = {
    get length() {
      return history.length
    },
    get scrollRestoration() {
      return history.scrollRestoration
    },
    set scrollRestoration(mode) {
      history.scrollRestoration = mode
    },
    get state() {
      return getState?.() ?? history.state
    },
    ...methods,
    pushState(data, _, url) {
      if (!stateDescriptor) {
        ;(history as any).state = data
      }

      return methods.pushState(data, _, url)
    },
    replaceState(data, _, url) {
      if (!stateDescriptor) {
        ;(history as any).state = data
      }

      return methods.replaceState(data, _, url)
    }
  }

  history.pushState = (state, _, url) => {
    if (url) {
      onEvent({ _tag: "PushState", state, url: getUrl(location.origin, url), skipCommit: false })
    } else {
      onEvent({ _tag: "ReplaceState", state, url: Option.none(), skipCommit: false })
    }
  }
  history.replaceState = (state, _, url) => {
    onEvent({
      _tag: "ReplaceState",
      state,
      url: url ? Option.some(getUrl(location.origin, url)) : Option.none(),
      skipCommit: false
    })
  }
  history.go = (delta) => {
    if (delta && delta !== 0) {
      onEvent({ _tag: "Traverse", delta, skipCommit: false })
    }
  }
  history.back = () => {
    onEvent({ _tag: "Traverse", delta: -1, skipCommit: false })
  }
  history.forward = () => {
    onEvent({ _tag: "Traverse", delta: 1, skipCommit: false })
  }

  // In a proper browser this will allow patching to hide the id/key's associated with the state
  if (stateDescriptor) {
    Object.defineProperty(history, "state", {
      get() {
        return getOriginalState(stateDescriptor.get!.call(history))
      }
    })
  }

  const onHashChange = (ev: HashChangeEvent) => {
    onEvent({ _tag: "ReplaceState", state: history.state, url: Option.some(new URL(ev.newURL)), skipCommit: false })
  }

  window.addEventListener("hashchange", onHashChange, { capture: true })

  const onPopState = (ev: PopStateEvent) => {
    if (isPatchedState(ev.state)) {
      onEvent({ _tag: "TraverseTo", key: ev.state.key, state: ev.state.originalHistoryState, skipCommit: true })
    } else {
      onEvent({ _tag: "ReplaceState", state: ev.state, url: Option.some(new URL(location.href)), skipCommit: true })
    }
  }

  window.addEventListener("popstate", onPopState, { capture: true })

  const unpatch = Effect.sync(() => {
    history.pushState = original.pushState
    history.replaceState = original.replaceState
    history.go = original.go
    history.back = original.back
    history.forward = original.forward

    if (stateDescriptor) {
      Object.defineProperty(history, "state", stateDescriptor)
    }

    window.removeEventListener("hashchange", onHashChange)
    window.removeEventListener("popstate", onPopState)
  })

  return {
    original,
    patched: history,
    unpatch
  } as const
}

type ScopedRuntime<R> = {
  readonly runtime: Runtime.Runtime<R | Scope.Scope>
  readonly scope: Scope.Scope
  readonly run: <E, A>(effect: Effect.Effect<R | Scope.Scope, E, A>) => Fiber.RuntimeFiber<E, A>
  readonly runPromise: <E, A>(effect: Effect.Effect<R | Scope.Scope, E, A>) => Promise<A>
}

function scopedRuntime<R>(): Effect.Effect<
  R | Scope.Scope,
  never,
  ScopedRuntime<R>
> {
  return Effect.gen(function*(_) {
    const runtime = yield* _(Effect.runtime<R | Scope.Scope>())
    const scope = unsafeGet(runtime.context, Scope.Scope)
    const runFork = Runtime.runFork(runtime)

    const run = <E, A>(effect: Effect.Effect<R | Scope.Scope, E, A>): Fiber.RuntimeFiber<E, A> =>
      runFork(effect, { scope })

    const runPromise = <E, A>(effect: Effect.Effect<R | Scope.Scope, E, A>): Promise<A> =>
      new Promise((resolve, reject) => {
        const fiber = run(effect)
        fiber.addObserver(Exit.match({
          onFailure: (cause) => reject(Runtime.makeFiberFailure(cause)),
          onSuccess: resolve
        }))
      })

    return {
      runtime,
      scope,
      run,
      runPromise
    } as const
  })
}
