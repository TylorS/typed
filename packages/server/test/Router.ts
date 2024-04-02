import * as PlatformRouter from "@effect/platform/Http/Router"
import * as ServerRequest from "@effect/platform/Http/ServerRequest"
import * as ServerResponse from "@effect/platform/Http/ServerResponse"
import { html } from "@effect/platform/Http/ServerResponse"
import { Schema } from "@effect/schema"
import * as Route from "@typed/route"
import { getCurrentParams } from "@typed/server/RouteHandler"
import * as Router from "@typed/server/Router"
import { ok } from "assert"
import { Effect } from "effect"
import { millis } from "effect/Duration"

describe("Router", () => {
  const fooRoute = Route.literal("/foo").concat(Route.integer("fooId"))
  const barRoute = Route.literal("/bar").concat(Route.integer("barId"))

  const router = Router.empty.pipe(
    Router.get(
      fooRoute,
      Effect.gen(function*(_) {
        const { params } = yield* _(getCurrentParams(fooRoute))
        return yield* _(html`<div>Foo: ${params.fooId}</div>`)
      })
    ),
    Router.get(
      barRoute,
      Effect.gen(function*(_) {
        const { params } = yield* _(getCurrentParams(barRoute))
        return yield* _(html`<div>Bar: ${params.barId}</div>`)
      })
    )
  )

  function makeRequest(url: string, init?: RequestInit) {
    const request = ServerRequest.fromWeb(new Request(url, init))
    return router.pipe(
      Effect.provideService(ServerRequest.ServerRequest, request),
      Effect.map(ServerResponse.toWeb)
    )
  }

  function makeTextRequest(url: string, init?: RequestInit) {
    return makeRequest(url, init).pipe(Effect.flatMap((response) => Effect.promise(() => response.text())))
  }

  it("matches routes", async () => {
    const test = Effect.gen(function*(_) {
      expect(yield* _(makeTextRequest("http://localhost/foo/123"))).toBe("<div>Foo: 123</div>")
      expect(yield* _(makeTextRequest("http://localhost/bar/456"))).toBe("<div>Bar: 456</div>")
    })

    await Effect.runPromise(test)
  })

  it("fails with RouteNotFound when route cannot be matched", async () => {
    const test = Effect.gen(function*(_) {
      const response = yield* _(makeRequest("http://localhost/baz/123"), Effect.either)
      ok(response._tag === "Left")
      ok(response.left._tag === "RouteNotFound")
    })

    await Effect.runPromise(test)
  })

  it("fails with RouteDecodeError when route params cannot be decoded", async () => {
    const test = Effect.gen(function*(_) {
      const response = yield* _(makeRequest("http://localhost/foo/abc"), Effect.either)
      ok(response._tag === "Left")
      ok(response.left._tag === "RouteDecodeError")
      expect(response.left.message).toBe(`RouteDecodeError: /foo/:fooId
{ fooId: integer }
└─ ["fooId"]
   └─ integer
      └─ From side refinement failure
         └─ NumberFromString
            └─ Transformation process failure
               └─ Expected NumberFromString, actual "abc"`)

      expect(response.left.toJSON()).toEqual({
        _tag: "RouteDecodeError",
        route: "/foo/:fooId",
        issue: [
          {
            _tag: "Type",
            path: ["fooId"],
            message: "Expected NumberFromString, actual \"abc\""
          }
        ]
      })
    })

    await Effect.runPromise(test)
  })

  it("tiny microbenchmark", async () => {
    const platformRouter = PlatformRouter.empty.pipe(
      PlatformRouter.get(
        fooRoute.path,
        Effect.gen(function*(_) {
          const { params } = yield* _(PlatformRouter.RouteContext)
          const decoded = yield* _(params, Schema.decodeUnknown(fooRoute.schema))
          return yield* _(ServerResponse.html`<div>Foo: ${decoded.fooId}</div>`)
        })
      ),
      PlatformRouter.get(
        barRoute.path,
        Effect.gen(function*(_) {
          const { params } = yield* _(PlatformRouter.RouteContext)
          const decoded = yield* _(params, Schema.decodeUnknown(barRoute.schema))
          return yield* _(ServerResponse.html`<div>Bar: ${decoded.barId}</div>`)
        })
      )
    )

    function makePlatformRequest(url: string, init?: RequestInit) {
      const request = ServerRequest.fromWeb(new Request(url, init))
      return platformRouter.pipe(
        Effect.provideService(ServerRequest.ServerRequest, request),
        Effect.map(ServerResponse.toWeb)
      )
    }

    function makePlatformTextRequest(url: string, init?: RequestInit) {
      return makePlatformRequest(url, init).pipe(Effect.flatMap((response) => Effect.promise(() => response.text())))
    }

    const test = Effect.gen(function*(_) {
      yield* _(timed("foo", makeTextRequest("http://localhost/foo/123")))
      yield* _(timed("foo platform", makePlatformTextRequest("http://localhost/foo/123")))
      yield* _(timed("bar", makeTextRequest("http://localhost/bar/123")))
      yield* _(timed("bar platform", makePlatformTextRequest("http://localhost/bar/123")))
    })

    await Effect.runPromise(test)
  })
})

const timed = <E>(name: string, effect: Effect.Effect<unknown, E>, iterations: number = 1000) =>
  Effect.gen(function*(_) {
    const runs: Array<number> = []
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      yield* _(effect)
      runs.push(performance.now() - start)
    }
    const total = runs.reduce((acc, run) => acc + run, 0)
    const average = total / runs.length
    const min = Math.min(...runs)
    const max = Math.max(...runs)

    console.table({
      name,
      iterations,
      total: millis(total).toString(),
      average: millis(average).toString(),
      min: millis(min).toString(),
      max: millis(max).toString()
    })
  })
