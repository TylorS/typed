import * as ServerRequest from "@effect/platform/Http/ServerRequest"
import * as ServerResponse from "@effect/platform/Http/ServerResponse"
import { html } from "@effect/platform/Http/ServerResponse"
import * as Route from "@typed/route"
import { getCurrentParams } from "@typed/server/RouteHandler"
import * as Router from "@typed/server/Router"
import { ok } from "assert"
import { Effect } from "effect"

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
    return Effect.gen(function*(_) {
      const request = ServerRequest.fromWeb(new Request(url, init))
      const [duration, serverResponse] = yield* _(
        router,
        Effect.timed,
        Effect.provideService(ServerRequest.ServerRequest, request)
      )

      console.log(`Request to ${url} took: ${duration.toString()}`)

      return ServerResponse.toWeb(serverResponse)
    })
  }

  function makeTextRequest(url: string, init?: RequestInit) {
    return Effect.gen(function*(_) {
      const response = yield* _(makeRequest(url, init))
      return yield* _(Effect.promise(() => response.text()))
    })
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
})
