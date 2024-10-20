import type { HttpClientError, HttpClientResponse } from "@effect/platform"
import { Headers, HttpClient, HttpClientRequest } from "@effect/platform"

import { Schema } from "@effect/schema"
import type * as Context from "@typed/context"
import * as RefSubject from "@typed/fx/RefSubject"
import type { Uuid } from "@typed/id"
import { GetRandomValues, makeUuid } from "@typed/id"
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import * as Option from "effect/Option"
import type * as Scope from "effect/Scope"
import type { Commit } from "../Layer.js"
import type {
  BeforeNavigationEvent,
  BeforeNavigationHandler,
  CancelNavigation,
  FormDataEvent,
  FormDataHandler,
  FormInputFrom,
  NavigateOptions,
  Navigation,
  NavigationError,
  NavigationEvent,
  NavigationHandler,
  ProposedDestination,
  RedirectError
} from "../Navigation.js"
import { Destination, Transition } from "../Navigation.js"

export type NavigationState = {
  readonly entries: ReadonlyArray<Destination>
  readonly index: number
  readonly transition: Option.Option<Transition>
}

export const NavigationState = Schema.Struct({
  entries: Schema.Array(Destination),
  index: Schema.Number,
  transition: Schema.OptionFromNullishOr(Transition, null)
})

export const getUrl = (origin: string, urlOrPath: string | URL): URL => {
  return typeof urlOrPath === "string" ? new URL(urlOrPath, origin) : urlOrPath
}

export type ModelAndIntent = {
  readonly state: RefSubject.RefSubject<NavigationState>
  readonly canGoBack: RefSubject.Computed<boolean>
  readonly canGoForward: RefSubject.Computed<boolean>
  readonly beforeHandlers: RefSubject.RefSubject<
    Set<readonly [BeforeNavigationHandler<any, any>, Context.Context<any>]>
  >
  readonly handlers: RefSubject.RefSubject<
    Set<readonly [NavigationHandler<any, any>, Context.Context<any>]>
  >

  readonly formDataHandlers: RefSubject.RefSubject<
    Set<readonly [FormDataHandler<any, any>, Context.Context<any>]>
  >

  readonly commit: Commit
}

const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308])

export function setupFromModelAndIntent(
  modelAndIntent: ModelAndIntent,
  origin: string,
  base: string,
  getRandomValues: Context.Fn.FnOf<typeof GetRandomValues>,
  newNavigationState?: () => NavigationState
) {
  const {
    beforeHandlers,
    canGoBack,
    canGoForward,
    commit,
    formDataHandlers,
    handlers,
    state
  } = modelAndIntent
  const entries = RefSubject.map(state, (s) => s.entries)
  const currentEntry = RefSubject.map(state, (s) => s.entries[s.index])
  const transition = RefSubject.map(state, (s) => s.transition)

  const runBeforeHandlers = (event: BeforeNavigationEvent) =>
    Effect.gen(function*() {
      const handlers = yield* beforeHandlers
      const matches: Array<
        Effect.Effect<unknown, RedirectError | CancelNavigation>
      > = []

      for (const [handler, ctx] of handlers) {
        const exit = yield* handler(event).pipe(
          Effect.provide(ctx),
          Effect.either
        )
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
          const exit = yield* Effect.either(match)
          if (Either.isLeft(exit)) {
            return Option.some(exit.left)
          }
        }
      }

      return Option.none<RedirectError | CancelNavigation>()
    })

  const runHandlers = (event: NavigationEvent) =>
    Effect.gen(function*() {
      const eventHandlers = yield* handlers
      const matches: Array<Effect.Effect<unknown>> = []

      for (const [handler, ctx] of eventHandlers) {
        const match = yield* Effect.provide(handler(event), ctx)
        if (Option.isSome(match)) {
          matches.push(Effect.provide(match.value, ctx))
        }
      }

      if (matches.length > 0) {
        yield* Effect.all(matches, { discard: true })
      }
    })

  const runFormDataHandlers = (
    event: FormDataEvent
  ): Effect.Effect<
    Either.Either<
      Option.Option<HttpClientResponse.HttpClientResponse>,
      RedirectError | CancelNavigation
    >,
    NavigationError | HttpClientError.HttpClientError,
    Scope.Scope | HttpClient.HttpClient.Service
  > =>
    Effect.gen(function*() {
      const handlers = yield* formDataHandlers
      const matches: Array<
        Effect.Effect<
          Option.Option<HttpClientResponse.HttpClientResponse>,
          RedirectError | CancelNavigation
        >
      > = []

      for (const [handler, ctx] of handlers) {
        const exit = yield* handler(event).pipe(
          Effect.provide(ctx),
          Effect.either
        )
        if (Either.isRight(exit)) {
          const match = exit.right
          if (Option.isSome(match)) {
            matches.push(Effect.provide(match.value, ctx))
          }
        } else {
          return Either.left(exit.left)
        }
      }

      if (matches.length > 0) {
        for (const match of matches) {
          const exit = yield* Effect.either(match)
          if (Either.isLeft(exit)) {
            return Either.left(exit.left)
          } else if (Option.isSome(exit.right)) {
            return Either.right(exit.right)
          }
        }
      } else {
        // Only if there are 0 matches, we'll make a request to the server ourselves
        const response = yield* makeFormDataRequest(
          event,
          Option.getOrElse(event.action, () => event.from.url.href)
        )

        return Either.right(Option.some(response))
      }

      return Either.right(Option.none())
    })

  const runNavigationEvent = (
    beforeEvent: BeforeNavigationEvent,
    get: Effect.Effect<NavigationState>,
    set: (a: NavigationState) => Effect.Effect<NavigationState>,
    depth: number,
    skipCommit: boolean = false
  ): Effect.Effect<Destination, NavigationError> =>
    Effect.gen(function*() {
      let current = yield* get
      current = yield* set({
        ...current,
        transition: Option.some(beforeEvent)
      })

      if (!skipCommit) {
        const beforeError = yield* runBeforeHandlers(beforeEvent)

        if (Option.isSome(beforeError)) {
          return yield* handleError(beforeError.value, get, set, depth)
        }
      }

      const to = isDestination(beforeEvent.to)
        ? beforeEvent.to
        : yield* upgradeProposedDestination(beforeEvent.to)

      if (!skipCommit) {
        yield* commit(to, beforeEvent)
      }

      if (newNavigationState) {
        const { entries, index } = yield* set(newNavigationState())

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

          yield* set({ entries, index, transition: Option.none() })
        } else if (beforeEvent.type === "replace") {
          const index = current.index
          const before = current.entries.slice(0, index)
          const after = current.entries.slice(index + 1)
          const entries = [...before, to, ...after]

          yield* set({ entries, index, transition: Option.none() })
        } else if (beforeEvent.type === "reload") {
          yield* set({ ...current, transition: Option.none() })
        } else {
          const { delta } = beforeEvent
          const nextIndex = current.index + delta

          yield* set({
            ...current,
            index: nextIndex,
            transition: Option.none()
          })
        }

        yield* runHandlers(event)
      }

      return to
    }).pipe(GetRandomValues.provide(getRandomValues))

  const handleError = (
    error: RedirectError | CancelNavigation,
    get: Effect.Effect<NavigationState>,
    set: (a: NavigationState) => Effect.Effect<NavigationState>,
    depth: number
  ): Effect.Effect<Destination, NavigationError> =>
    Effect.gen(function*() {
      if (depth >= 25) {
        return yield* Effect.dieMessage(`Redirect loop detected.`)
      }

      const { entries, index } = yield* get
      const from = entries[index]

      if (error._tag === "CancelNavigation") {
        yield* set({ entries, index, transition: Option.none() })

        return from
      } else {
        const event = yield* makeRedirectEvent(origin, error, from)

        return yield* runNavigationEvent(event, get, set, depth + 1)
      }
    }).pipe(GetRandomValues.provide(getRandomValues))

  const navigate = (
    pathOrUrl: string | URL,
    options?: NavigateOptions,
    skipCommit: boolean = false
  ) =>
    state.runUpdates(({ get, set }) =>
      Effect.gen(function*() {
        const state = yield* get
        const from = state.entries[state.index]
        const history = options?.history ?? "auto"
        const to = yield* makeOrUpdateDestination(
          state,
          getUrl(origin, pathOrUrl),
          options?.state,
          origin
        ).pipe(GetRandomValues.provide(getRandomValues))
        const type = history === "auto"
          ? from.key === to.key
            ? "replace"
            : "push"
          : history
        const event: BeforeNavigationEvent = {
          type,
          from,
          to,
          delta: type === "replace" ? 0 : 1,
          info: options?.info
        }

        return yield* runNavigationEvent(event, get, set, 0, skipCommit)
      })
    )

  const traverseTo = (
    key: Destination["key"],
    options?: { readonly info?: unknown },
    skipCommit: boolean = false
  ) =>
    state.runUpdates(({ get, set }) =>
      Effect.gen(function*() {
        const state = yield* get
        const { entries, index } = state
        const from = entries[index]
        const nextIndex = entries.findIndex((e) => e.key === key)

        if (nextIndex === -1) return from

        const id = yield* makeUuid.pipe(
          GetRandomValues.provide(getRandomValues)
        )
        const to = { ...entries[nextIndex], id }
        const delta = nextIndex - index
        const event: BeforeNavigationEvent = {
          type: "traverse",
          from,
          to,
          delta,
          info: options?.info
        }

        return yield* runNavigationEvent(event, get, set, 0, skipCommit)
      })
    )

  const back = (
    options?: { readonly info?: unknown },
    skipCommit: boolean = false
  ) =>
    Effect.gen(function*() {
      const { entries, index } = yield* state
      if (index === 0) return entries[index]
      const { key } = entries[index - 1]

      return yield* traverseTo(key, options, skipCommit)
    })

  const forward = (
    options?: { readonly info?: unknown },
    skipCommit: boolean = false
  ) =>
    Effect.gen(function*() {
      const { entries, index } = yield* state
      if (index === entries.length - 1) return entries[index]
      const { key } = entries[index + 1]

      return yield* traverseTo(key, options, skipCommit)
    })

  const reload = (
    options?: { readonly info?: unknown },
    skipCommit: boolean = false
  ) =>
    state.runUpdates(({ get, set }) =>
      Effect.gen(function*() {
        const { entries, index } = yield* state
        const current = entries[index]

        const event: BeforeNavigationEvent = {
          type: "reload",
          from: current,
          to: current,
          delta: 0,
          info: options?.info
        }

        return yield* runNavigationEvent(event, get, set, 0, skipCommit)
      })
    )

  const beforeNavigation = <R = never, R2 = never>(
    handler: BeforeNavigationHandler<R, R2>
  ): Effect.Effect<void, never, R | R2 | Scope.Scope> =>
    Effect.contextWithEffect((ctx) => {
      const entry = [handler, ctx] as const

      return Effect.zipRight(
        RefSubject.update(
          beforeHandlers,
          (handlers) => new Set([...handlers, entry])
        ),
        Effect.addFinalizer(() =>
          RefSubject.update(beforeHandlers, (handlers) => {
            const updated = new Set(handlers)
            updated.delete(entry)
            return updated
          })
        )
      )
    })

  const onNavigation = <R = never, R2 = never>(
    handler: NavigationHandler<R, R2>
  ): Effect.Effect<void, never, R | R2 | Scope.Scope> =>
    Effect.contextWithEffect((ctx) => {
      const entry = [handler, ctx] as const

      return Effect.zipRight(
        RefSubject.update(
          handlers,
          (handlers) => new Set([...handlers, entry])
        ),
        Effect.addFinalizer(() =>
          RefSubject.update(handlers, (handlers) => {
            const updated = new Set(handlers)
            updated.delete(entry)
            return updated
          })
        )
      )
    })

  const updateCurrentEntry = (options: { readonly state: unknown }) =>
    state.runUpdates(({ get, set }) =>
      Effect.gen(function*() {
        const { entries, index } = yield* get
        const current = entries[index]
        const event: BeforeNavigationEvent = {
          type: "replace",
          from: current,
          to: { ...current, state: options.state },
          delta: 0,
          info: null
        }

        return yield* runNavigationEvent(event, get, set, 0)
      })
    )

  const submit = (
    data: FormData,
    input?: Omit<FormInputFrom, "data">
  ): Effect.Effect<
    Option.Option<HttpClientResponse.HttpClientResponse>,
    NavigationError | HttpClientError.HttpClientError,
    Scope.Scope | HttpClient.HttpClient.Service
  > =>
    state.runUpdates(({ get, set }) =>
      Effect.gen(function*() {
        const { entries, index } = yield* get
        const from = entries[index]
        const event: FormDataEvent = {
          from,
          data,
          name: Option.fromNullable(input?.name),
          action: Option.fromNullable(input?.action),
          method: Option.fromNullable(input?.method),
          encoding: Option.fromNullable(input?.encoding)
        }

        const either = yield* runFormDataHandlers(event)

        if (Either.isLeft(either)) {
          yield* handleError(either.left, get, set, 0)
          return Option.none<HttpClientResponse.HttpClientResponse>()
        } else {
          if (Option.isNone(either.right)) {
            return either.right
          }

          const response = either.right.value

          // If it is a redirect
          if (REDIRECT_STATUS_CODES.has(response.status)) {
            const location = Headers.get(response.headers, "location")

            // And we have a location header
            if (Option.isSome(location)) {
              // Then we navigate to that location
              yield* navigate(location.value, { history: "replace" })
            }
          }

          return Option.some(response)
        }
      })
    )

  const onFormData = <R = never, R2 = never>(
    handler: FormDataHandler<R, R2>
  ): Effect.Effect<void, never, R | R2 | Scope.Scope> =>
    Effect.contextWithEffect((ctx) => {
      const entry = [handler, ctx] as const

      return Effect.zipRight(
        RefSubject.update(
          formDataHandlers,
          (handlers) => new Set([...handlers, entry])
        ),
        Effect.addFinalizer(() =>
          RefSubject.update(formDataHandlers, (handlers) => {
            const updated = new Set(handlers)
            updated.delete(entry)
            return updated
          })
        )
      )
    })

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
    updateCurrentEntry,
    submit,
    onFormData
  } satisfies Navigation

  return navigation
}

export function makeRedirectEvent(
  origin: string,
  redirect: RedirectError,
  from: Destination
) {
  return Effect.gen(function*() {
    const url = getUrl(origin, redirect.path)
    const to = yield* makeDestination(url, redirect.options?.state, origin)
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

export function makeOrUpdateDestination(
  navigationState: NavigationState,
  url: URL,
  state: unknown,
  origin: string
) {
  return Effect.gen(function*() {
    const current = navigationState.entries[navigationState.index]
    const isSameOriginAndPath = url.origin === current.url.origin &&
      url.pathname === current.url.pathname

    if (isSameOriginAndPath) {
      const id = yield* makeUuid
      const destination: Destination = {
        id,
        key: current.key,
        url,
        state: getOriginalState(state),
        sameDocument: url.origin === origin
      }

      return destination
    } else {
      return yield* makeDestination(url, state, origin)
    }
  })
}

export function makeDestination(url: URL, state: unknown, origin: string) {
  return Effect.gen(function*() {
    if (isPatchedState(state)) {
      const destination: Destination = {
        id: state.__typed__navigation__id__,
        key: state.__typed__navigation__key__,
        url,
        state: state.__typed__navigation__state__,
        sameDocument: url.origin === origin
      }

      return destination
    }

    const id = yield* makeUuid
    const key = yield* makeUuid

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
  return Effect.gen(function*() {
    const id = yield* makeUuid
    const key = yield* makeUuid

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

export type PatchedState = {
  readonly __typed__navigation__id__: Uuid
  readonly __typed__navigation__key__: Uuid
  readonly __typed__navigation__state__: unknown
}

export function isPatchedState(state: unknown): state is PatchedState {
  if (state === null || !(typeof state === "object") || Array.isArray(state)) {
    return false
  }
  if (
    "__typed__navigation__id__" in state &&
    "__typed__navigation__key__" in state
  ) {
    return true
  }
  return false
}

export function getOriginalState(state: unknown) {
  if (isPatchedState(state)) return state.__typed__navigation__state__
  return state
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

export function isDestination(
  proposed: ProposedDestination
): proposed is Destination {
  return "id" in proposed && "key" in proposed
}

const strictEqual = <A>(a: A, b: A) => a === b

export function makeHandlersState() {
  return Effect.gen(function*() {
    const beforeHandlers = yield* RefSubject.fromEffect(
      Effect.sync(
        () =>
          new Set<
            readonly [BeforeNavigationHandler<any, any>, Context.Context<any>]
          >()
      ),
      { eq: strictEqual }
    )
    const handlers = yield* RefSubject.fromEffect(
      Effect.sync(
        () =>
          new Set<
            readonly [NavigationHandler<any, any>, Context.Context<any>]
          >()
      ),
      { eq: strictEqual }
    )
    const formDataHandlers = yield* RefSubject.fromEffect(
      Effect.sync(
        () => new Set<readonly [FormDataHandler<any, any>, Context.Context<any>]>()
      ),
      { eq: strictEqual }
    )

    return {
      beforeHandlers,
      handlers,
      formDataHandlers
    }
  })
}

function makeFormDataRequest(event: FormDataEvent, url: string) {
  const headers = new globalThis.Headers()

  if (Option.isSome(event.encoding)) {
    headers.set("Content-Type", event.encoding.value)
  }
  const method = Option.getOrElse(event.method, () => "POST")

  return Effect.flatMap(HttpClient.HttpClient, (client) =>
    client.execute(
      HttpClientRequest.make(method as "POST")(url, {
        headers: Headers.fromInput(headers)
      }).pipe(HttpClientRequest.bodyFormData(event.data))
    ))
}
