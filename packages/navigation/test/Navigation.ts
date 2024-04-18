import * as HttpClient from "@effect/platform/HttpClient"
import { Window } from "@typed/dom/Window"
import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import { isUuid } from "@typed/id"
import * as Navigation from "@typed/navigation"
import { deepStrictEqual, ok } from "assert"
import { Effect } from "effect"
import * as Option from "effect/Option"
import * as happyDOM from "happy-dom"
import { describe, it } from "vitest"

const equalDestination = (a: Navigation.Destination, b: Navigation.Destination) => {
  const { id: _aId, ...aRest } = a
  const { id: _bId, ...bRest } = b
  deepStrictEqual(aRest, bRest)
}

const equalDestinations = (a: ReadonlyArray<Navigation.Destination>, b: ReadonlyArray<Navigation.Destination>) => {
  const as = a.map(({ id: _, ...rest }) => rest)
  const bs = b.map(({ id: _, ...rest }) => rest)

  return deepStrictEqual(as, bs)
}

describe(__filename, () => {
  describe("Navigation", () => {
    it.only("memory", async () => {
      const url = new URL("https://example.com/foo/1")
      const state = { x: Math.random() }
      const test = Effect.gen(function*(_) {
        const { back, beforeNavigation, currentEntry, entries, forward, navigate, onNavigation, traverseTo } = yield* _(
          Navigation.Navigation
        )
        const initial = yield* _(currentEntry)

        expect(isUuid(initial.id)).toEqual(true)
        expect(isUuid(initial.key)).toEqual(true)
        expect(initial.url).toEqual(url)
        expect(initial.state).toEqual(state)
        expect(initial.sameDocument).toEqual(true)
        expect(yield* _(entries)).toEqual([initial])

        const count = yield* _(RefSubject.of(0))

        yield* _(beforeNavigation(() => Effect.succeedSome(RefSubject.update(count, (x) => x + 10))))
        yield* _(onNavigation(() => Effect.succeedSome(RefSubject.update(count, (x) => x * 2))))

        const second = yield* _(navigate("/foo/2"))

        expect(second.url).toEqual(new URL("/foo/2", url.origin))
        expect(second.state).toEqual(undefined)
        expect(second.sameDocument).toEqual(true)
        equalDestinations(yield* _(entries), [initial, second])

        expect(yield* _(count)).toEqual(20)

        equalDestination(yield* _(back()), initial)
        equalDestination(yield* _(forward()), second)

        expect(yield* _(count)).toEqual(140)

        const third = yield* _(navigate("/foo/3"))

        expect(third.url).toEqual(new URL("/foo/3", url.origin))
        expect(third.state).toEqual(undefined)
        expect(third.sameDocument).toEqual(true)
        equalDestinations(yield* _(entries), [initial, second, third])

        expect(yield* _(count)).toEqual(300)

        equalDestination(yield* _(traverseTo(initial.key)), initial)
        equalDestination(yield* _(forward()), second)

        expect(yield* _(count)).toEqual(1260)
      }).pipe(
        Effect.provide(Navigation.initialMemory({ url, state })),
        Effect.scoped
      )

      await Effect.runPromise(test)
    })

    describe("window", () => {
      const url = new URL("https://example.com/foo/1")
      const state = { x: Math.random() }

      it("manages navigation", async () => {
        const window = makeWindow({ url: url.href }, state)
        const test = Effect.gen(function*(_) {
          const { back, beforeNavigation, currentEntry, entries, forward, navigate, onNavigation, traverseTo } =
            yield* _(
              Navigation.Navigation
            )
          const initial = yield* _(currentEntry)

          expect(isUuid(initial.id)).toEqual(true)
          expect(isUuid(initial.key)).toEqual(true)
          expect(initial.url).toEqual(url)
          expect(initial.state).toEqual(state)
          expect(initial.sameDocument).toEqual(true)
          expect(yield* _(entries)).toEqual([initial])

          const count = yield* _(RefSubject.of(0))

          yield* _(beforeNavigation(() => Effect.succeedSome(RefSubject.update(count, (x) => x + 10))))
          yield* _(onNavigation(() => Effect.succeedSome(RefSubject.update(count, (x) => x * 2))))

          const second = yield* _(navigate("/foo/2"))

          expect(second.url).toEqual(new URL("/foo/2", url.origin))
          expect(second.state).toEqual(undefined)
          expect(second.sameDocument).toEqual(true)
          equalDestinations(yield* _(entries), [initial, second])

          expect(yield* _(count)).toEqual(20)

          equalDestination(yield* _(back()), initial)
          equalDestination(yield* _(forward()), second)

          expect(yield* _(count)).toEqual(140)

          const third = yield* _(navigate("/foo/3"))

          expect(third.url).toEqual(new URL("/foo/3", url.origin))
          expect(third.state).toEqual(undefined)
          expect(third.sameDocument).toEqual(true)
          equalDestinations(yield* _(entries), [initial, second, third])

          expect(yield* _(count)).toEqual(300)

          equalDestination(yield* _(traverseTo(initial.key)), initial)
          equalDestination(yield* _(forward()), second)

          expect(yield* _(count)).toEqual(1260)
        }).pipe(
          Effect.provide(Navigation.fromWindow),
          Window.provide(window),
          Effect.scoped
        )

        await Effect.runPromise(test)
      })

      it("manages state with History API", async () => {
        const window = makeWindow({ url: url.href }, { id: "foo", key: "bar", originalHistoryState: state })
        const test = Effect.gen(function*(_) {
          const { history } = yield* _(Window)

          const current = yield* _(Navigation.CurrentEntry)

          // Initializes from History state when possible
          deepStrictEqual(current.id, "foo")
          deepStrictEqual(current.key, "bar")

          deepStrictEqual(current.state, state)
          deepStrictEqual(history.state, { id: current.id, key: current.key, originalHistoryState: state })

          const next = yield* _(Navigation.navigate("/foo/2"))

          deepStrictEqual(next.state, undefined)
          deepStrictEqual(history.state, { id: next.id, key: next.key, originalHistoryState: undefined })
        }).pipe(
          Effect.provide(Navigation.fromWindow),
          Window.provide(window),
          Effect.scoped
        )

        await Effect.runPromise(test)
      })

      it("responds to popstate events", async () => {
        const window = makeWindow({ url: url.href }, { id: "foo", key: "bar", originalHistoryState: state })
        const test = Effect.gen(function*(_) {
          const { history, location } = yield* _(Window)

          const current = yield* _(Navigation.CurrentEntry)

          // Initializes from History state when possible
          deepStrictEqual(current.id, "foo")
          deepStrictEqual(current.key, "bar")

          deepStrictEqual(current.state, state)
          deepStrictEqual(history.state, { id: current.id, key: current.key, originalHistoryState: state })

          const next = yield* _(Navigation.navigate("/foo/2"))

          deepStrictEqual(next.state, undefined)
          deepStrictEqual(history.state, { id: next.id, key: next.key, originalHistoryState: undefined })

          // Manually change the URL
          location.href = url.href

          const popstateEventState = { id: current.id, key: current.key, originalHistoryState: state }
          const popstateEvent = new window.PopStateEvent("popstate")
          ;(popstateEvent as any).state = popstateEventState

          window.dispatchEvent(popstateEvent)

          // Allow fibers to run
          yield* _(Effect.sleep(0))

          const popstate = yield* _(Navigation.CurrentEntry)

          deepStrictEqual(popstate.id, "foo")
          deepStrictEqual(popstate.key, "bar")

          deepStrictEqual(popstate.state, state)
          deepStrictEqual(history.state, popstateEventState)
        }).pipe(
          Effect.provide(Navigation.fromWindow),
          Window.provide(window),
          Effect.scoped
        )

        await Effect.runPromise(test)
      })

      it("responds to hashchange events", async () => {
        const initialState = { id: "foo", key: "bar", originalHistoryState: state }
        const window = makeWindow({ url: url.href }, initialState)
        const test = Effect.gen(function*(_) {
          const { history, location } = yield* _(Window)
          const { currentEntry } = yield* _(Navigation.Navigation)

          const current = yield* _(currentEntry)

          // Initializes from History state when possible
          deepStrictEqual(current.key, "bar")
          deepStrictEqual(current.url.hash, "")

          deepStrictEqual(current.state, state)
          deepStrictEqual(history.state, initialState)

          const hashChangeEvent = new window.HashChangeEvent("hashchange")

          // We need to force hasChangeEvent to have these proeprties
          Object.assign(hashChangeEvent, {
            oldURL: location.href,
            newURL: location.href + "#baz"
          })

          window.dispatchEvent(hashChangeEvent)

          yield* _(Effect.sleep(1))

          const hashChange = yield* _(currentEntry)

          deepStrictEqual(hashChange.key, "bar")
          deepStrictEqual(hashChange.url.hash, "#baz")
          deepStrictEqual(hashChange.state, state)
          deepStrictEqual(history.state, { ...initialState, id: hashChange.id })
        }).pipe(
          Effect.provide(Navigation.fromWindow),
          Window.provide(window),
          Effect.scoped
        )

        await Effect.runPromise(test)
      })
    })

    describe("beforeNavigation", () => {
      const url = new URL("https://example.com/foo/1")
      const state = { initial: Math.random() }
      const redirectUrl = new URL("https://example.com/bar/42")
      const redirect = Navigation.redirectToPath(redirectUrl)

      it("allows performing redirects", async () => {
        const test = Effect.gen(function*(_) {
          const navigation = yield* _(Navigation.Navigation)
          const initial = yield* _(navigation.currentEntry)

          deepStrictEqual(initial.url, url)

          yield* _(
            navigation.beforeNavigation((handler) =>
              Effect.gen(function*(_) {
                const current = yield* _(navigation.currentEntry)

                // Runs before the URL has been committed
                deepStrictEqual(current.url, handler.from.url)

                return yield* _(handler.to.url === url ? Effect.fail(redirect) : Effect.succeedNone)
              })
            )
          )

          yield* _(navigation.navigate(url))

          const next = yield* _(navigation.currentEntry)

          deepStrictEqual(next.url, redirectUrl)

          // Redirects replace the current entry
          deepStrictEqual(yield* _(navigation.entries), [next])
        }).pipe(
          Effect.provide(Navigation.initialMemory({ url, state })),
          Effect.scoped
        )

        await Effect.runPromise(test)
      })

      it("allows canceling navigation", async () => {
        const test = Effect.gen(function*(_) {
          const navigation = yield* _(Navigation.Navigation)
          const initial = yield* _(navigation.currentEntry)

          deepStrictEqual(initial.url, url)

          yield* _(
            navigation.beforeNavigation((handler) =>
              Effect.gen(function*(_) {
                const current = yield* _(navigation.currentEntry)

                // Runs before the URL has been committed
                deepStrictEqual(current.url, handler.from.url)

                return yield* _(
                  handler.to.url === redirectUrl ? Effect.fail(Navigation.cancelNavigation) : Effect.succeedNone
                )
              })
            )
          )

          yield* _(navigation.navigate(redirectUrl))

          const next = yield* _(navigation.currentEntry)

          deepStrictEqual(next.url, url)

          deepStrictEqual(yield* _(navigation.entries), [initial])
        }).pipe(
          Effect.provide(Navigation.initialMemory({ url, state })),
          Effect.scoped
        )

        await Effect.runPromise(test)
      })
    })

    describe("onNavigation", () => {
      const url = new URL("https://example.com/foo/1")
      const redirectUrl = new URL("https://example.com/bar/42")
      const redirect = Navigation.redirectToPath(redirectUrl)
      const intermmediateUrl = new URL("https://example.com/foo/2")

      it("runs only after the url has been committed", async () => {
        const test = Effect.gen(function*(_) {
          const navigation = yield* _(Navigation.Navigation)

          let beforeCount = 0
          let afterCount = 0

          yield* _(navigation.beforeNavigation((event) =>
            Effect.gen(function*(_) {
              beforeCount++

              if (event.to.url === intermmediateUrl) {
                return yield* _(Effect.fail(redirect))
              }

              return Option.none()
            })
          ))

          yield* _(navigation.onNavigation((event) =>
            Effect.sync(() => {
              deepStrictEqual(event.destination.url, redirectUrl)

              afterCount++
              return Option.none()
            })
          ))

          yield* _(navigation.navigate(intermmediateUrl))

          // Called once for intermmediateUrl
          // Then again for the redirectUrl
          deepStrictEqual(beforeCount, 2)

          // Only called once with the redirectUrl
          deepStrictEqual(afterCount, 1)
        }).pipe(Effect.provide(Navigation.initialMemory({ url })), Effect.scoped)

        await Effect.runPromise(test)
      })
    })

    describe("transition", () => {
      const url = new URL("https://example.com/foo/1")
      const nextUrl = new URL("https://example.com/foo/2")

      it("captures any ongoing transitions", async () => {
        const test = Effect.gen(function*(_) {
          const { navigate, transition } = yield* _(Navigation.Navigation)
          const fiber = yield* _(transition, Fx.take(2), Fx.toReadonlyArray, Effect.forkScoped)

          // Allow fiber to start
          yield* _(Effect.sleep(0))

          yield* _(navigate(nextUrl))

          const events = yield* _(Effect.fromFiber(fiber))

          deepStrictEqual(events[0], Option.none())
          ok(Option.isSome(events[1]))
          const event = events[1].value
          deepStrictEqual(event.from.url, url)
          deepStrictEqual(event.to.url, nextUrl)
        }).pipe(Effect.provide(Navigation.initialMemory({ url })), Effect.scoped)
        await Effect.runPromise(test)
      })
    })

    describe("native navigation", () => {
      const url = new URL("https://example.com/foo/1")
      const state = { x: Math.random() }

      it("manages navigation", async () => {
        const window = makeWindow({ url: url.href }, state)
        const NavigationPolyfill = await import("@virtualstate/navigation")
        const { history, navigation } = NavigationPolyfill.getCompletePolyfill({ window: window as any })
        ;(window as any).navigation = navigation as any
        window.history = history as History
        const test = Effect.gen(function*(_) {
          const { back, beforeNavigation, currentEntry, entries, forward, navigate, onNavigation, traverseTo } =
            yield* _(
              Navigation.Navigation
            )
          const initial = yield* _(currentEntry)

          expect(isUuid(initial.id)).toEqual(true)
          expect(isUuid(initial.key)).toEqual(true)
          expect(initial.url).toEqual(url)
          expect(initial.state).toEqual(state)
          expect(initial.sameDocument).toEqual(true)
          expect(yield* _(entries)).toEqual([initial])

          const count = yield* _(RefSubject.of(0))

          yield* _(beforeNavigation(() => Effect.succeedSome(RefSubject.update(count, (x) => x + 10))))
          yield* _(onNavigation(() => Effect.succeedSome(RefSubject.update(count, (x) => x * 2))))

          const second = yield* _(navigate("/foo/2"))

          expect(second.url).toEqual(new URL("/foo/2", url.origin))
          expect(second.state).toEqual(undefined)
          expect(second.sameDocument).toEqual(true)
          equalDestinations(yield* _(entries), [initial, second])

          expect(yield* _(count)).toEqual(20)

          equalDestination(yield* _(back()), initial)
          equalDestination(yield* _(forward()), second)

          expect(yield* _(count)).toEqual(140)

          const third = yield* _(navigate("/foo/3"))

          expect(third.url).toEqual(new URL("/foo/3", url.origin))
          expect(third.state).toEqual(undefined)
          expect(third.sameDocument).toEqual(true)
          equalDestinations(yield* _(entries), [initial, second, third])

          expect(yield* _(count)).toEqual(300)

          equalDestination(yield* _(traverseTo(initial.key)), initial)
          equalDestination(yield* _(forward()), second)

          expect(yield* _(count)).toEqual(1260)
        }).pipe(
          Effect.provide(Navigation.fromWindow),
          Window.provide(window),
          Effect.scoped
        )

        await Effect.runPromise(test)
      })
    })

    describe("FormData", () => {
      it("allows submiting a Form with FormData", async () => {
        const url = new URL("https://example.com/foo/1")
        const state = { x: Math.random() }
        const window = makeWindow({ url: url.href }, state)

        const test = Effect.gen(function*(_) {
          const { onFormData, submit } = yield* _(Navigation.Navigation)
          const data = new FormData()
          data.set("foo", "bar")
          data.set("bar", "baz")

          let called = false
          let matched = false

          yield* _(onFormData((event) =>
            Effect.sync(() => {
              called = true
              deepStrictEqual(event.data.get("foo"), "bar")
              deepStrictEqual(event.data.get("bar"), "baz")

              // Optionally, you can return an Effect to "intercept" this event
              return Option.some(Effect.sync(() => {
                matched = true
                // Here you could make an HttpRequest and return the Option.some(ClientResponse)
                return Option.none()
              }))
            })
          ))

          yield* _(submit(data))

          deepStrictEqual(called, true)
          deepStrictEqual(matched, true)
        }).pipe(
          Effect.provide(Navigation.fromWindow),
          Window.provide(window),
          // Only used when no handlers intercept the event
          // At which point the form will be submitted using the HttpClient
          // And the submit will resolve with Option.Some<ClientResponse>
          Effect.provide(HttpClient.client.layer),
          Effect.scoped
        )

        await Effect.runPromise(test)
      })
    })
  })

  describe("useBlockNavigation", () => {
    const url = new URL("https://example.com/foo/1")
    const nextUrl = new URL("https://example.com/bar/42")

    it("allows blocking the current navigation", async () => {
      const test = Effect.gen(function*(_) {
        const blockNavigation = yield* _(Navigation.useBlockNavigation())
        let didBlock = false

        yield* _(
          blockNavigation,
          Fx.compact,
          Fx.tapEffect((blocking) => {
            didBlock = true
            return blocking.confirm
          }),
          Fx.forkScoped
        )

        // Let fiber start
        yield* _(Effect.sleep(1))

        yield* _(Navigation.navigate(nextUrl), Effect.either)

        deepStrictEqual(didBlock, true)

        deepStrictEqual(yield* _(Navigation.CurrentPath), "/bar/42")
      }).pipe(Effect.provide(Navigation.initialMemory({ url })), Effect.scoped)

      await Effect.runPromise(test)
    })

    it("allows cancelling the current navigation", async () => {
      const test = Effect.gen(function*(_) {
        const blockNavigation = yield* _(Navigation.useBlockNavigation())
        let didBlock = false

        yield* _(
          blockNavigation,
          Fx.tapEffect(Option.match({
            onNone: () => Effect.void,
            onSome: (blocking) => {
              didBlock = true
              return blocking.cancel
            }
          })),
          Fx.forkScoped
        )

        yield* _(Navigation.navigate(nextUrl))

        deepStrictEqual(didBlock, true)

        const currentEntry = yield* _(Navigation.CurrentEntry)

        deepStrictEqual(currentEntry.url.pathname, "/foo/1")
      }).pipe(Effect.provide(Navigation.initialMemory({ url })), Effect.scoped)

      await Effect.runPromise(test)
    })
  })
})

function makeWindow(options?: ConstructorParameters<typeof happyDOM.Window>[0], state?: unknown) {
  const window = new happyDOM.Window(options)

  // If state is provided, replace the current history state
  if (state !== undefined) {
    ;(window.history as any).state = state
  }

  return window as any as Window & typeof globalThis & Pick<happyDOM.Window, "happyDOM">
}
