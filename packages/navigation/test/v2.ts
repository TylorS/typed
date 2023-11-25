import { Window } from "@typed/dom/Window"
import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import { isUuid } from "@typed/id"
import * as Navigation from "@typed/navigation/v2"
import { deepStrictEqual, ok } from "assert"
import { Effect } from "effect"
import * as Option from "effect/Option"
import * as happyDOM from "happy-dom"
import type IHappyDOMOptions from "happy-dom/lib/window/IHappyDOMOptions.js"
import { describe, it } from "vitest"

describe(__filename, () => {
  describe("Navigation", () => {
    it("memory", async () => {
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

        yield* _(beforeNavigation(() => Effect.succeedSome(count.update((x) => x + 10))))
        yield* _(onNavigation(() => Effect.succeedSome(count.update((x) => x * 2))))

        const second = yield* _(navigate("/foo/2"))

        expect(second.url).toEqual(new URL("/foo/2", url.origin))
        expect(second.state).toEqual(undefined)
        expect(second.sameDocument).toEqual(true)
        expect(yield* _(entries)).toEqual([initial, second])

        expect(yield* _(count)).toEqual(20)

        expect(yield* _(back())).toEqual(initial)
        expect(yield* _(forward())).toEqual(second)

        expect(yield* _(count)).toEqual(140)

        const third = yield* _(navigate("/foo/3"))

        expect(third.url).toEqual(new URL("/foo/3", url.origin))
        expect(third.state).toEqual(undefined)
        expect(third.sameDocument).toEqual(true)
        expect(yield* _(entries)).toEqual([initial, second, third])

        expect(yield* _(count)).toEqual(300)

        expect(yield* _(traverseTo(initial.key))).toEqual(initial)
        expect(yield* _(forward())).toEqual(second)

        expect(yield* _(count)).toEqual(1260)
      }).pipe(
        Effect.provide(Navigation.initialMemory({ url, state })),
        Effect.scoped
      )

      await Effect.runPromise(test)
    })

    it("window", async () => {
      const url = new URL("https://example.com/foo/1")
      const state = { x: Math.random() }
      const window = makeWindow({ url: url.href }, state)
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

        yield* _(beforeNavigation(() => Effect.succeedSome(count.update((x) => x + 10))))
        yield* _(onNavigation(() => Effect.succeedSome(count.update((x) => x * 2))))

        const second = yield* _(navigate("/foo/2"))

        expect(second.url).toEqual(new URL("/foo/2", url.origin))
        expect(second.state).toEqual(undefined)
        expect(second.sameDocument).toEqual(true)
        expect(yield* _(entries)).toEqual([initial, second])

        expect(yield* _(count)).toEqual(20)

        expect(yield* _(back())).toEqual(initial)
        expect(yield* _(forward())).toEqual(second)

        expect(yield* _(count)).toEqual(140)

        const third = yield* _(navigate("/foo/3"))

        expect(third.url).toEqual(new URL("/foo/3", url.origin))
        expect(third.state).toEqual(undefined)
        expect(third.sameDocument).toEqual(true)
        expect(yield* _(entries)).toEqual([initial, second, third])

        expect(yield* _(count)).toEqual(300)

        expect(yield* _(traverseTo(initial.key))).toEqual(initial)
        expect(yield* _(forward())).toEqual(second)

        expect(yield* _(count)).toEqual(1260)
      }).pipe(
        Effect.provide(Navigation.fromWindow),
        Window.provide(window),
        Effect.scoped
      )

      await Effect.runPromise(test)
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
          Fx.tap((option) => {
            if (Option.isNone(option)) {
              return Effect.unit
            } else {
              const blocking = option.value
              didBlock = true
              return blocking.confirm
            }
          }),
          Fx.forkScoped
        )

        yield* _(Navigation.navigate(nextUrl))

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
          Fx.tap((option) => {
            if (Option.isNone(option)) {
              return Effect.unit
            } else {
              const blocking = option.value
              didBlock = true
              return blocking.cancel
            }
          }),
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

function makeWindow(options?: IHappyDOMOptions, state?: unknown) {
  const window = new happyDOM.Window(options)

  // If state is provided, replace the current history state
  if (state !== undefined) {
    ;(window.history as any).state = state
  }

  return window as any as Window & typeof globalThis & Pick<happyDOM.Window, "happyDOM">
}
