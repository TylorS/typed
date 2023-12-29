import { RefSubject } from "@typed/fx"
import type { Renderable } from "@typed/template/Renderable"
import { html, RenderTemplate } from "@typed/template/RenderTemplate"
import { testRender } from "@typed/template/Test"
import { describe, it, test } from "@typed/template/Vitest"
import { deepStrictEqual, ok } from "assert"
import * as Effect from "effect/Effect"
import { range } from "effect/ReadonlyArray"

export function tmpl<const Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: Values
) {
  return RenderTemplate.withEffect((render) => render(template, values))
}

describe("Render", () => {
  test("renders a simple template", () => {
    return Effect.gen(function*(_) {
      const { elementRef, window } = yield* _(testRender(html`<div>Hello, world!</div>`))
      const rendered = yield* _(elementRef)

      ok(rendered instanceof window.HTMLDivElement)
      deepStrictEqual(rendered.innerText, "Hello, world!")
    })
  })

  test("renders a simple template with attributes", () =>
    Effect.gen(function*(_) {
      const { elementRef, window } = yield* _(testRender(html`<div class="foo" id="bar">Hello, world!</div>`))
      const rendered = yield* _(elementRef)

      ok(
        rendered instanceof window.HTMLDivElement
      )
      deepStrictEqual(rendered.className, "foo")
      deepStrictEqual(rendered.id, "bar")
      deepStrictEqual(rendered.innerText, "Hello, world!")
    }))

  it("renders a simple template with attributes", () =>
    Effect.gen(function*(_) {
      const { elementRef, window } = yield* _(testRender(html`<div class="foo" id="bar">Hello, world!</div>`))
      const rendered = yield* _(elementRef)

      ok(rendered instanceof window.HTMLDivElement)
      deepStrictEqual(rendered.className, "foo")
      deepStrictEqual(rendered.id, "bar")
      deepStrictEqual(rendered.innerText, "Hello, world!")
    }))

  test("renders a nested templates", () =>
    Effect.gen(function*(_) {
      const { elementRef, window } = yield* _(testRender(html`<div class="foo" id="bar">Hello, world!</div>`))
      const rendered = yield* _(elementRef)

      ok(rendered instanceof window.HTMLDivElement)
      deepStrictEqual(rendered.className, "foo")
      deepStrictEqual(rendered.id, "bar")
      deepStrictEqual(rendered.innerText, "Hello, world!")
    }))

  describe("counter", () => {
    it("renders a counter", () => {
      const decrement = (x: number) => Math.max(0, x - 1)
      const increment = (x: number) => x + 1

      return Effect.gen(function*(_) {
        const count = yield* _(RefSubject.of(0))
        const rendered = yield* _(testRender(
          html`
          <button class="dec" onclick=${RefSubject.update(count, decrement)}>-</button>
          <p>${count}</p>
          <button class="inc" onclick=${RefSubject.update(count, increment)}>-</button>
        `
        ))

        const dec = rendered.click({ selector: ".dec" })
        const inc = rendered.click({ selector: ".inc" })

        yield* _(Effect.forEach(range(1, 3), () => inc))
        yield* _(Effect.forEach(range(1, 6), () => dec))
        yield* _(Effect.forEach(range(1, 5), () => inc))

        expect(yield* _(count)).toEqual(4)
      }).pipe(Effect.scoped)
    })
  })
})
