import * as Fx from "@typed/fx/Fx"
import * as Navigation from "@typed/navigation"
import * as Route from "@typed/route"
import * as Router from "@typed/router"
import { renderToHtmlString, staticLayer } from "@typed/template/Html"
import { testRender } from "@typed/template/Test"
import * as Vitest from "@typed/template/Vitest"
import { Link } from "@typed/ui/Link"
import { deepStrictEqual, ok } from "assert"
import { Effect } from "effect"
import { describe } from "vitest"

describe("Link", () => {
  const initialUrl = new URL("https://example.com/foo")

  describe("relative links", () => {
    Vitest.test("defaults to relative links", () =>
      Effect.gen(function*(_) {
        const { elementRef, window } = yield* _(testRender(Link({ to: "/test" }, "Hello")))
        const element = yield* _(elementRef)

        ok(element instanceof window.HTMLAnchorElement)
        deepStrictEqual(element.href, "/foo/test")
        deepStrictEqual(element.textContent, "Hello")
      }).pipe(
        Effect.provide(Navigation.initialMemory({ url: initialUrl })),
        Router.withCurrentRoute(Route.literal("/foo"))
      ))

    // Vitest.test("works with Effect as Links", () =>
    //   Effect.gen(function*(_) {
    //     const { elementRef, window } = yield* _(testRender(Link({ to: Effect.succeed("/test") }, "Hello")))
    //     const element = yield* _(elementRef)

    //     ok(element instanceof window.HTMLAnchorElement)
    //     deepStrictEqual(element.href, "/foo/test")
    //     deepStrictEqual(element.textContent, "Hello")
    //   }).pipe(
    //     Effect.provide(Navigation.initialMemory({ url: initialUrl })),
    //     Router.withCurrentRoute(Route.fromPath("/foo"))
    //   ))

    Vitest.test("works with Fx as Links", () =>
      Effect.gen(function*(_) {
        const { elementRef, window } = yield* _(testRender(Link({ to: Fx.succeed("/test") }, "Hello")))
        const element = yield* _(elementRef)

        ok(element instanceof window.HTMLAnchorElement)
        deepStrictEqual(element.href, "/foo/test")
        deepStrictEqual(element.textContent, "Hello")
      }).pipe(
        Effect.provide(Navigation.initialMemory({ url: initialUrl })),
        Router.withCurrentRoute(Route.literal("/foo"))
      ))

    Vitest.test("works with non-relative links", () =>
      Effect.gen(function*(_) {
        const { elementRef, window } = yield* _(testRender(Link({ to: Fx.succeed("/test"), relative: false }, "Hello")))
        const element = yield* _(elementRef)

        ok(element instanceof window.HTMLAnchorElement)
        deepStrictEqual(element.href, "/test")
        deepStrictEqual(element.textContent, "Hello")
      }).pipe(
        Effect.provide(Navigation.initialMemory({ url: initialUrl })),
        Router.withCurrentRoute(Route.literal("/foo"))
      ))

    Vitest.test("updates the current URL when clicked", () =>
      Effect.gen(function*(_) {
        const test = yield* _(testRender(Link({ to: Fx.succeed("/test") }, "Hello")))

        yield* _(test.click())

        const { url } = yield* _(Navigation.CurrentEntry)

        deepStrictEqual(url.href, initialUrl + "/test")
      }).pipe(
        Effect.provide(Navigation.initialMemory({ url: initialUrl })),
        Router.withCurrentRoute(Route.literal("/foo"))
      ))

    Vitest.test("sets other anchor attributes", () =>
      Effect.gen(function*(_) {
        const { elementRef, window } = yield* _(testRender(Link({ to: "/test", hidden: true }, "Hello")))
        const element = yield* _(elementRef)

        ok(element instanceof window.HTMLAnchorElement)
        deepStrictEqual(element.href, "/foo/test")
        deepStrictEqual(element.hidden, true)
        deepStrictEqual(element.textContent, "Hello")
      }).pipe(
        Effect.provide(Navigation.initialMemory({ url: initialUrl })),
        Router.withCurrentRoute(Route.literal("/foo"))
      ))

    Vitest.test.only("renders to html", () =>
      Effect.gen(function*(_) {
        const html = yield* _(
          renderToHtmlString(
            Link({ to: Fx.succeed("/test"), className: Fx.succeed("nav-link"), relative: false }, "Hello")
          )
        )

        deepStrictEqual(html, `<a class="nav-link" href="/test">Hello</a>`)
      }).pipe(
        Effect.provide(Navigation.initialMemory({ url: initialUrl })),
        Router.withCurrentRoute(Route.literal("/foo")),
        Effect.provide(staticLayer)
      ))
  })
})
