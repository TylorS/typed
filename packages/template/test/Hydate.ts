import * as Fx from "@typed/fx"
import { html, many } from "@typed/template"
import { testHydrate } from "@typed/template/Test"
import { describe, it } from "@typed/template/Vitest"
import { deepStrictEqual, ok } from "assert"
import { Effect } from "effect"

describe("Hydrate", () => {
  it("hydrates a simple template", () =>
    Effect.gen(function*(_) {
      const { elementRef, elements: { div } } = yield* _(
        testHydrate(html`<div>Hello, world!</div>`, (rendered, window) => {
          ok(rendered instanceof window.HTMLDivElement)
          return {
            div: rendered
          }
        })
      )

      const rendered = yield* _(elementRef)

      ok(rendered === div)
    }))

  it("hydrates a template using many", () =>
    Effect.gen(function*(_) {
      const { elementRef, elements: { listItems, ul }, window } = yield* _(
        testHydrate(
          html`<ul>${many(Fx.succeed([1, 2, 3]), (x) => x, (ref) => html`<li>${ref}</li>`)}</ul>`,
          (rendered, window) => {
            ok(rendered instanceof window.HTMLUListElement)

            return {
              ul: rendered,
              listItems: Array.from(rendered.children)
            }
          }
        )
      )

      const rendered = yield* _(elementRef)

      ok(rendered instanceof window.HTMLUListElement)

      ok(rendered === ul)
      deepStrictEqual(listItems, Array.from(rendered.children))
    }))
})
