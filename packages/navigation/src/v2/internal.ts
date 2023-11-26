import type { Fn } from "@typed/context"
import { Window } from "@typed/dom/Window"
import { RefSubject } from "@typed/fx"
import type { Computed } from "@typed/fx/Computed"
import { scopedRuntime } from "@typed/fx/internal/helpers"
import { GetRandomValues, getRandomValues, makeUuid, Uuid } from "@typed/id"
import type {
  BeforeNavigationEvent,
  BeforeNavigationHandler,
  CancelNavigation,
  Destination,
  NavigateOptions,
  NavigationEvent,
  NavigationHandler,
  ProposedDestination,
  RedirectError,
  Transition
} from "@typed/navigation/v2/Navigation"
import { Navigation, NavigationError } from "@typed/navigation/v2/Navigation"
import { Effect, Either, Option } from "effect"
import type { Context, Layer, Scope } from "effect"

// TODO: FormData events
// TODO: Link click events

type NavigationState = {
  readonly entries: ReadonlyArray<Destination>
  readonly index: number
  readonly transition: Option.Option<Transition>
}

type Commit = (to: Destination, event: BeforeNavigationEvent) => Effect.Effect<never, NavigationError, void>

const getUrl = (origin: string, urlOrPath: string | URL): URL => {
  return typeof urlOrPath === "string" ? new URL(urlOrPath, origin) : urlOrPath
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type NativeNavigation = import("@virtualstate/navigation").Navigation
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type NativeEntry = import("@virtualstate/navigation").NavigationHistoryEntry
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type NativeEvent = import("@virtualstate/navigation").NavigationEventMap["navigate"]

declare global {
  export interface Window {
    navigation?: NativeNavigation
  }
}

export const fromWindow: Layer.Layer<Window, never, Navigation> = Navigation.scoped(
  Window.withEffect((window) =>
    Effect.gen(function*(_) {
      const getRandomValues = (length: number) =>
        Effect.sync(() => window.crypto.getRandomValues(new Uint8Array(length)))
      const { run, runPromise } = yield* _(scopedRuntime<never>())
      const hasNativeNavigation = !!window.navigation
      const modelAndIntent = yield* _(
        hasNativeNavigation
          ? setupWithNavigation(window.navigation!, runPromise)
          : setupWithHistory(window, (event) => run(handleHistoryEvent(event))),
        GetRandomValues.provide(getRandomValues)
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
    })
  )
)

export interface MemoryOptions {
  readonly entries: ReadonlyArray<Destination>
  readonly origin?: string | undefined
  readonly base?: string | undefined
  readonly currentIndex?: number | undefined
  readonly maxEntries?: number | undefined
  readonly commit?: Commit
}

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

export interface InitialMemoryOptions {
  readonly url: string | URL
  readonly origin?: string | undefined
  readonly base?: string | undefined
  readonly maxEntries?: number | undefined
  readonly state?: unknown
  readonly commit?: Commit
}

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

function getBaseHref(window: Window) {
  const base = window.document.querySelector("base")
  return base ? base.href : "/"
}

type ModelAndIntent = {
  readonly state: RefSubject.RefSubject<never, never, NavigationState>
  readonly canGoBack: Computed<
    never,
    never,
    boolean
  >
  readonly canGoForward: Computed<
    never,
    never,
    boolean
  >
  readonly beforeHandlers: RefSubject.RefSubject<
    never,
    never,
    Set<readonly [BeforeNavigationHandler<any, any>, Context.Context<any>]>
  >
  readonly handlers: RefSubject.RefSubject<
    never,
    never,
    Set<readonly [NavigationHandler<any, any>, Context.Context<any>]>
  >
  readonly commit: Commit
}

function setupFromModelAndIntent(
  modelAndIntent: ModelAndIntent,
  origin: string,
  base: string,
  getRandomValues: Fn.FnOf<typeof GetRandomValues>,
  newNavigationState?: () => NavigationState
) {
  const { beforeHandlers, canGoBack, canGoForward, commit, handlers, state } = modelAndIntent

  const entries = state.map((s) => s.entries)
  const currentEntry = state.map((s) => s.entries[s.index])
  const transition = state.map((s) => s.transition)

  const runBeforeHandlers = (event: BeforeNavigationEvent) =>
    Effect.gen(function*(_) {
      const handlers = yield* _(beforeHandlers)
      const matches: Array<Effect.Effect<never, RedirectError | CancelNavigation, unknown>> = []

      for (const [handler, ctx] of handlers) {
        const exit = yield* _(handler(event), Effect.provide(ctx), Effect.either)
        if (Either.isRight(exit)) {
          const match = exit.right
          if (Option.isSome(match)) {
            matches.push(Effect.provide(match.value, ctx))
          }
        } else {
          return Option.some(exit.left)
        }
      }

      if (matches.length > 0) {
        for (const match of matches) {
          const exit = yield* _(match, Effect.either)
          if (Either.isLeft(exit)) {
            return Option.some(exit.left)
          }
        }
      }

      return Option.none<RedirectError | CancelNavigation>()
    })

  const runHandlers = (event: NavigationEvent) =>
    Effect.gen(function*(_) {
      const eventHandlers = yield* _(handlers)
      const matches: Array<Effect.Effect<never, never, unknown>> = []

      for (const [handler, ctx] of eventHandlers) {
        const match = yield* _(handler(event), Effect.provide(ctx))
        if (Option.isSome(match)) {
          matches.push(Effect.provide(match.value, ctx))
        }
      }

      if (matches.length > 0) {
        yield* _(Effect.all(matches, { concurrency: "unbounded" }))
      }
    })

  const runNavigationEvent = (
    beforeEvent: BeforeNavigationEvent,
    get: Effect.Effect<never, never, NavigationState>,
    set: (a: NavigationState) => Effect.Effect<never, never, NavigationState>,
    depth: number,
    skipCommit: boolean = false
  ): Effect.Effect<never, NavigationError, Destination> =>
    Effect.gen(function*(_) {
      let current = yield* _(get)
      current = yield* _(set({ ...current, transition: Option.some(beforeEvent) }))

      if (!skipCommit) {
        const beforeError = yield* _(runBeforeHandlers(beforeEvent))

        if (Option.isSome(beforeError)) {
          return yield* _(handleError(beforeError.value, get, set, depth))
        }
      }

      const to = isDestination(beforeEvent.to) ? beforeEvent.to : yield* _(upgradeProposedDestination(beforeEvent.to))

      if (!skipCommit) {
        yield* _(commit(to, beforeEvent))
      }

      if (newNavigationState) {
        const { entries, index } = yield* _(set(newNavigationState()))

        return entries[index]
      } else {
        const event: NavigationEvent = {
          type: beforeEvent.type,
          info: beforeEvent.info,
          destination: to
        }

        if (beforeEvent.type === "push") {
          const index = current.index + 1
          const entries = current.entries.slice(0, index).concat([to])

          yield* _(set({ entries, index, transition: Option.none() }))
        } else if (beforeEvent.type === "replace") {
          const index = current.index
          const before = current.entries.slice(0, index)
          const after = current.entries.slice(index + 1)
          const entries = [...before, to, ...after]

          yield* _(set({ entries, index, transition: Option.none() }))
        } else if (beforeEvent.type === "reload") {
          yield* _(set({ ...current, transition: Option.none() }))
        } else {
          const { delta } = beforeEvent
          const nextIndex = current.index + delta

          yield* _(set({ ...current, index: nextIndex, transition: Option.none() }))
        }

        yield* _(runHandlers(event))
      }

      return to
    }).pipe(GetRandomValues.provide(getRandomValues))

  const handleError = (
    error: RedirectError | CancelNavigation,
    get: Effect.Effect<never, never, NavigationState>,
    set: (a: NavigationState) => Effect.Effect<never, never, NavigationState>,
    depth: number
  ) =>
    Effect.gen(function*(_) {
      if (depth >= 25) {
        return yield* _(Effect.dieMessage(`Redirect loop detected.`))
      }

      const { entries, index } = yield* _(get)
      const from = entries[index]

      if (error._tag === "CancelNavigation") {
        yield* _(set({ entries, index, transition: Option.none() }))

        return from
      } else {
        const event = yield* _(makeRedirectEvent(origin, error, from))

        return yield* _(runNavigationEvent(event, get, set, depth + 1))
      }
    })

  const navigate = (pathOrUrl: string | URL, options?: NavigateOptions, skipCommit: boolean = false) =>
    state.runUpdate((get, set) =>
      Effect.gen(function*(_) {
        const state = yield* _(get)
        const from = state.entries[state.index]
        const history = options?.history ?? "auto"
        const to = yield* _(
          makeOrUpdateDestination(state, getUrl(origin, pathOrUrl), options?.state, origin),
          GetRandomValues.provide(getRandomValues)
        )
        const type = history === "auto" ? from.key === to.key ? "replace" : "push" : history
        const event: BeforeNavigationEvent = {
          type,
          from,
          to,
          delta: type === "replace" ? 0 : 1,
          info: options?.info
        }

        return yield* _(runNavigationEvent(event, get, set, 0, skipCommit))
      })
    )

  const traverseTo = (key: Destination["key"], options?: { readonly info?: unknown }, skipCommit: boolean = false) =>
    state.runUpdate((get, set) =>
      Effect.gen(function*(_) {
        const state = yield* _(get)
        const { entries, index } = state
        const from = entries[index]
        const nextIndex = entries.findIndex((e) => e.key === key)

        if (nextIndex === -1) return from

        const id = yield* _(makeUuid, GetRandomValues.provide(getRandomValues))
        const to = { ...entries[nextIndex], id }
        const delta = nextIndex - index
        const event: BeforeNavigationEvent = {
          type: "traverse",
          from,
          to,
          delta,
          info: options?.info
        }

        return yield* _(runNavigationEvent(event, get, set, 0, skipCommit))
      })
    )

  const back = (options?: { readonly info?: unknown }, skipCommit: boolean = false) =>
    Effect.gen(function*(_) {
      const { entries, index } = yield* _(state)
      if (index === 0) return entries[index]
      const { key } = entries[index - 1]

      return yield* _(traverseTo(key, options, skipCommit))
    })

  const forward = (options?: { readonly info?: unknown }, skipCommit: boolean = false) =>
    Effect.gen(function*(_) {
      const { entries, index } = yield* _(state)
      if (index === entries.length - 1) return entries[index]
      const { key } = entries[index + 1]

      return yield* _(traverseTo(key, options, skipCommit))
    })

  const reload = (options?: { readonly info?: unknown }, skipCommit: boolean = false) =>
    state.runUpdate((get, set) =>
      Effect.gen(function*(_) {
        const { entries, index } = yield* _(state)
        const current = entries[index]

        const event: BeforeNavigationEvent = {
          type: "reload",
          from: current,
          to: current,
          delta: 0,
          info: options?.info
        }

        return yield* _(runNavigationEvent(event, get, set, 0, skipCommit))
      })
    )

  const beforeNavigation = <R = never, R2 = never>(
    handler: BeforeNavigationHandler<R, R2>
  ): Effect.Effect<R | R2 | Scope.Scope, never, void> =>
    Effect.contextWithEffect((ctx) => {
      const entry = [handler, ctx] as const

      return Effect.zipRight(
        beforeHandlers.update((handlers) => new Set([...handlers, entry])),
        Effect.addFinalizer(() =>
          beforeHandlers.update((handlers) => {
            const updated = new Set(handlers)
            updated.delete(entry)
            return updated
          })
        )
      )
    })

  const onNavigation = <R = never, R2 = never>(
    handler: NavigationHandler<R, R2>
  ): Effect.Effect<R | R2 | Scope.Scope, never, void> =>
    Effect.contextWithEffect((ctx) => {
      const entry = [handler, ctx] as const

      return Effect.zipRight(
        handlers.update((handlers) => new Set([...handlers, entry])),
        Effect.addFinalizer(() =>
          handlers.update((handlers) => {
            const updated = new Set(handlers)
            updated.delete(entry)
            return updated
          })
        )
      )
    })

  const updateCurrentEntry = (options: { readonly state: unknown }) =>
    state.runUpdate((get, set) =>
      Effect.gen(function*(_) {
        const { entries, index } = yield* _(get)
        const current = entries[index]
        const event: BeforeNavigationEvent = {
          type: "replace",
          from: current,
          to: { ...current, state: options.state },
          delta: 0,
          info: null
        }

        return yield* _(runNavigationEvent(event, get, set, 0))
      })
    )

  const navigation = {
    back,
    base,
    beforeNavigation,
    canGoBack,
    canGoForward,
    currentEntry,
    entries,
    forward,
    navigate,
    onNavigation,
    origin,
    reload,
    transition,
    traverseTo,
    updateCurrentEntry
  } satisfies Navigation

  return navigation
}

const getNavigationState = (navigation: NativeNavigation): NavigationState => {
  const entries = navigation.entries().map(nativeEntryToDestination)
  const currentEntry = navigation.currentEntry
  const index = currentEntry.index

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
    const state = yield* _(RefSubject.fromEffect(Effect.sync((): NavigationState => getNavigationState(navigation))))
    const canGoBack = state.map((s) => s.index > 0)
    const canGoForward = state.map((s) => s.index < s.entries.length - 1)
    const { beforeHandlers, handlers } = yield* _(makeHandlersState())
    const commit: Commit = (to: Destination, event: BeforeNavigationEvent) =>
      Effect.gen(function*(_) {
        const { key, state, url } = to
        const { info, type } = event

        if (type === "push" || type === "replace") {
          yield* _(
            Effect.promise(() => navigation.navigate(url.toString(), { history: type, state, info }).finished),
            Effect.catchAllDefect((error) => Effect.fail(new NavigationError({ error })))
          )
        } else if (event.type === "reload") {
          yield* _(
            Effect.promise(() => navigation.reload({ state, info }).finished),
            Effect.catchAllDefect((error) => Effect.fail(new NavigationError({ error })))
          )
        } else {
          yield* _(
            Effect.promise(() => navigation.traverseTo(key, { info }).finished),
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
          yield* _(Effect.all(matches, { concurrency: "unbounded" }))
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
        )
      )
    )
    const canGoBack = state.map((s) => s.index > 0)
    const canGoForward = state.map((s) => s.index < s.entries.length - 1)
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
    } as const
  })
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

function makeOrUpdateDestination(
  navigationState: NavigationState,
  url: URL,
  state: unknown,
  origin: string
) {
  return Effect.gen(function*(_) {
    const current = navigationState.entries[navigationState.index]
    const isSameOriginAndPath = url.origin === current.url.origin && url.pathname === current.url.pathname

    if (isSameOriginAndPath) {
      const id = yield* _(makeUuid)
      const destination: Destination = {
        id,
        key: current.key,
        url,
        state: getOriginalState(state),
        sameDocument: url.origin === origin
      }

      return destination
    } else {
      return yield* _(makeDestination(url, state, origin))
    }
  })
}

export function makeDestination(url: URL, state: unknown, origin: string) {
  return Effect.gen(function*(_) {
    if (isPatchedState(state)) {
      const destination: Destination = {
        id: state.id,
        key: state.key,
        url,
        state: state.originalHistoryState,
        sameDocument: url.origin === origin
      }

      return destination
    }

    const id = yield* _(makeUuid)
    const key = yield* _(makeUuid)

    const destination: Destination = {
      id,
      key,
      url,
      state,
      sameDocument: url.origin === origin
    }

    return destination
  })
}

export function upgradeProposedDestination(proposed: ProposedDestination) {
  return Effect.gen(function*(_) {
    const id = yield* _(makeUuid)
    const key = yield* _(makeUuid)

    const destination: Destination = {
      id,
      key,
      url: proposed.url,
      state: proposed.state,
      sameDocument: proposed.sameDocument
    }

    return destination
  })
}

function makeHandlersState() {
  return Effect.gen(function*(_) {
    const beforeHandlers = yield* _(
      RefSubject.fromEffect(
        Effect.sync(() => new Set<readonly [BeforeNavigationHandler<any, any>, Context.Context<any>]>())
      )
    )
    const handlers = yield* _(
      RefSubject.fromEffect(
        Effect.sync(() => new Set<readonly [NavigationHandler<any, any>, Context.Context<any>]>())
      )
    )

    return {
      beforeHandlers,
      handlers
    }
  })
}

function makeRedirectEvent(
  origin: string,
  redirect: RedirectError,
  from: Destination
) {
  return Effect.gen(function*(_) {
    const url = getUrl(origin, redirect.path)
    const to = yield* _(makeDestination(url, redirect.options?.state, origin))
    const event: BeforeNavigationEvent = {
      type: "replace",
      from,
      to,
      delta: 0,
      info: redirect.options?.info
    }

    return event
  })
}

type HistoryEvent = PushStateEvent | ReplaceStateEvent | TraverseEvent | TraverseToEvent

type PushStateEvent = { _tag: "PushState"; state: unknown; url: URL; skipCommit: boolean }
type ReplaceStateEvent = { _tag: "ReplaceState"; state: unknown; url: Option.Option<URL>; skipCommit: boolean }
type TraverseEvent = { _tag: "Traverse"; delta: number; skipCommit: boolean }
type TraverseToEvent = { _tag: "TraverseTo"; key: Uuid; state: unknown; skipCommit: boolean }

type PatchedState = {
  readonly id: Uuid
  readonly key: Uuid
  readonly originalHistoryState: unknown
}

function isPatchedState(state: unknown): state is PatchedState {
  if (state === null || !(typeof state === "object") || Array.isArray(state)) return false
  if ("id" in state && "key" in state && "originalHistoryState" in state) return true
  return false
}

function getOriginalState(state: unknown) {
  if (isPatchedState(state)) return state.originalHistoryState
  return state
}

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
      return stateDescriptor?.get?.() ?? history.state
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
        return getOriginalState(original.state)
      }
    })
  }

  const onHashChange = () => {
    onEvent({ _tag: "ReplaceState", state: history.state, url: Option.some(new URL(location.href)), skipCommit: false })
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

export function getOriginFromUrl(url: string | URL) {
  try {
    if (typeof url === "string") {
      return new URL(url).origin
    } else {
      return url.origin
    }
  } catch {
    return "http://localhost"
  }
}

export function isDestination(proposed: ProposedDestination): proposed is Destination {
  return "id" in proposed && "key" in proposed
}
