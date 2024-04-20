import * as Fx from "@typed/fx"
import { html, many } from "@typed/template"
import { testHydrate } from "@typed/template/Test"
import { describe, it } from "@typed/template/Vitest"
import { isComment } from "@typed/wire"
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

  it("hydrates fragments", () =>
    Effect.gen(function*(_) {
      const { elementRef, elements, window } = yield* _(
        testHydrate(
          html`${html`<header>Header</header>`}<main>${html`<h1>${html`<span>${"Content"}</span>`}</h1>`}</main>${html`<footer>Footer</footer>`}`,
          (rendered) => {
            ok(Array.isArray(rendered))
            ok(rendered.length === 5)
            const [header, /** HOLE */, main, footer /** HOLE */] = rendered

            return {
              header,
              main,
              footer
            }
          }
        )
      )

      const rendered = yield* _(elementRef)

      ok(Array.isArray(rendered))
      ok(rendered.length === 5)

      const [header, /** HOLE */, main, footer /** HOLE */] = rendered

      ok(header instanceof window.HTMLElement)
      ok(header.tagName === "HEADER")
      ok(header.textContent === "Header")
      ok(header === elements.header)

      ok(main instanceof window.HTMLElement)
      ok(main.tagName === "MAIN")
      ok(main.childNodes.length === 2)
      ok(main.firstChild instanceof window.HTMLElement)
      ok(main.firstChild.tagName === "H1")
      ok(main.firstChild.textContent === "Content")
      ok(isComment(main.childNodes[1])) // HOLE
      ok(main === elements.main)

      ok(footer instanceof window.HTMLElement)
      ok(footer.tagName === "FOOTER")
      ok(footer.textContent === "Footer")
      ok(footer === elements.footer)
    }))
})
