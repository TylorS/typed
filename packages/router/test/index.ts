import { CurrentEnvironment } from "@typed/environment"
import * as Fx from "@typed/fx"
import * as Navigation from "@typed/navigation"
import * as Router from "@typed/router"
import type { ReadonlyArray } from "effect"
import { Effect, Layer } from "effect"

describe("Router", () => {
  function testRouter(urls: ReadonlyArray.NonEmptyReadonlyArray<string>, expected: ReadonlyArray<string>) {
    return Effect.gen(function*(_) {
      const router = Router
        .to("/foo/:id", ({ id }) => `/foo/${id}`)
        .to("/bar/:id", ({ id }) => `/bar/${id}`)
        .to("/baz/:id", ({ id }) => `/baz/${id}`)
        .redirect("/foo/123")

      const fiber = yield* _(Fx.take(router, expected.length), Fx.toReadonlyArray, Effect.fork)

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
})

const resources = (url: string) =>
  Navigation.initialMemory({ url }).pipe(
    Layer.provideMerge(Router.layer("/")),
    Layer.provideMerge(CurrentEnvironment.layer("test"))
  )
