import { CurrentEnvironment, Environment } from "@typed/environment"
import * as Fx from "@typed/fx"
import * as Navigation from "@typed/navigation"
import * as Route from "@typed/route"
import * as Router from "@typed/router"
import { deepStrictEqual } from "assert"
import type { Array } from "effect"
import { Effect, Layer } from "effect"

describe("Router", () => {
  function testRouter(urls: Array.NonEmptyReadonlyArray<string>, expected: ReadonlyArray<string>) {
    return Effect.gen(function*(_) {
      const router = Router
        .to(Route.literal("/foo/:id"), ({ id }) => `/foo/${id}`)
        .to(Route.literal("/bar/:id"), ({ id }) => `/bar/${id}`)
        .to(Route.literal("/baz/:id"), ({ id }) => `/baz/${id}`)

      const fiber = yield* _(
        Fx.take(Router.redirectTo(router, Route.literal("/foo/:id"), { id: "123" }), expected.length),
        Fx.toReadonlyArray,
        Effect.fork
      )

      yield* _(Effect.sleep(1))

      for (let i = 1; i < urls.length; ++i) {
        yield* _(Navigation.navigate(urls[i]))
        yield* _(Effect.sleep(1))
      }

      const result = yield* _(Effect.fromFiber(fiber))

      expect(result).toEqual(expected)
    }).pipe(Effect.provide(resources(urls[0])), Effect.scoped)
  }

  it("allows matching routes to Fx", async () => {
    await Effect.runPromise(testRouter(
      ["/foo/123", "/bar/123", "/baz/123"],
      ["/foo/123", "/bar/123", "/baz/123"]
    ))
  })

  it("handles redirects", async () => {
    await Effect.runPromise(testRouter(["/zzz/999"], ["/foo/123"]))
  })

  describe(Router.makeHref, () => {
    it("creates a path for a route", async () => {
      const test = Effect.gen(function*(_) {
        const href = yield* _(Router.makeHref(Route.literal("/foo/:id"), { id: "123" }))

        deepStrictEqual(href, "/foo/123")
      }).pipe(Effect.provide(resources("/")), Effect.scoped)

      await Effect.runPromise(test)
    })
  })

  describe(Router.isActive, () => {
    it("returns true if the route is active", async () => {
      const test = Effect.gen(function*(_) {
        console.log("CurrentEntry", yield* _(Navigation.CurrentEntry))
        console.log("CurrentPath", yield* _(Navigation.CurrentPath))
        const active = yield* _(Router.isActive(Route.literal("/foo/:id"), { id: "123" }))

        expect(active).toBe(true)
      }).pipe(Effect.provide(resources("/foo/123")), Effect.scoped)

      await Effect.runPromise(test)
    })

    it("returns false if the route is not active", async () => {
      const test = Effect.gen(function*(_) {
        const active = yield* _(Router.isActive(Route.literal("/foo/:id"), { id: "456" }))

        expect(active).toBe(false)
      }).pipe(Effect.provide(resources("/foo/123")), Effect.scoped)

      await Effect.runPromise(test)
    })
  })
})

const resources = (url: string) =>
  Navigation.initialMemory({ url: `http://localhost${url}` }).pipe(
    Layer.provideMerge(Router.layer(Route.end)),
    Layer.provideMerge(CurrentEnvironment.layer(Environment.dom.test))
  )
