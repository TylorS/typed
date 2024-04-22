import * as Fx from "@typed/fx"
import { html, many } from "@typed/template"
import { testHydrate } from "@typed/template/Test"
import { describe, it } from "@typed/template/Vitest"
import { isComment } from "@typed/wire"
import { deepEqual, deepStrictEqual, ok } from "assert"
import { Effect } from "effect"

describe("Hydrate", () => {
  it("hydrates a simple template", () =>
    Effect.gen(function*(_) {
      const { elementRef, elements: { div }, window } = yield* _(
        testHydrate(html`<div>Hello, world!</div>`, (rendered, window) => {
          ok(Array.isArray(rendered))
          // Hydration uses 2 comments to separate a template from its surrounding context
          ok(rendered.length === 3)
          ok(rendered[1] instanceof window.HTMLDivElement)
          return {
            div: rendered[1]
          }
        })
      )

      const rendered = yield* _(elementRef)
      ok(rendered instanceof window.HTMLDivElement)
      ok(rendered === div)
    }))

  it("hydrates a template using many", () =>
    Effect.gen(function*(_) {
      const { elementRef, elements: { listItems, ul }, window } = yield* _(
        testHydrate(
          html`<ul>${many(Fx.succeed([1, 2, 3]), (x) => x, (ref) => html`<li>${ref}</li>`)}</ul>`,
          (rendered, window) => {
            ok(Array.isArray(rendered))
            ok(rendered.length === 3)
            ok(rendered[1] instanceof window.HTMLUListElement)

            return {
              ul: rendered[1],
              listItems: Array.from(rendered[1].children)
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
            // Includes comments and holes for tempaltes
            deepStrictEqual(rendered.length, 11)
            const [, , header, , , main, , footer] = rendered

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
      ok(main.firstElementChild instanceof window.HTMLElement)
      ok(main.firstElementChild.tagName === "H1")
      ok(main.firstElementChild.textContent === "Content")
      ok(main === elements.main)

      ok(footer instanceof window.HTMLElement)
      ok(footer.tagName === "FOOTER")
      ok(footer.textContent === "Footer")
      ok(footer === elements.footer)
    }))

  it("hydrates nested fragments", () =>
    Effect.gen(function*(_) {
      const { elementRef, elements, window } = yield* _(
        testHydrate(
          html`${html`<header>Header</header><nav>Navigation</nav>`}<main>${html`<h1>${html`<span>${"Test"}</span><span>${"Content"}</span>`}</h1>`}</main>${html`<div>Nested</div><footer>Footer</footer>`}`,
          (rendered) => {
            ok(Array.isArray(rendered))
            deepEqual(rendered.length, 13)
            const [, , header, navigation, , , main, , div, footer] = rendered

            return {
              header,
              navigation,
              main,
              div,
              footer
            }
          }
        )
      )

      const rendered = yield* _(elementRef)

      ok(Array.isArray(rendered))

      const [header, navigation, /** HOLE */, main, div, footer /** HOLE */] = rendered

      ok(header instanceof window.HTMLElement)
      ok(header.tagName === "HEADER")
      ok(header.textContent === "Header")
      ok(header === elements.header)

      ok(navigation instanceof window.HTMLElement)
      ok(navigation.tagName === "NAV")
      ok(navigation.textContent === "Navigation")
      ok(navigation === elements.navigation)

      ok(main instanceof window.HTMLElement)
      ok(main.tagName === "MAIN")
      deepStrictEqual(main.childNodes.length, 4)
      const [, h1] = main.childNodes

      ok(h1 instanceof window.HTMLElement)
      deepStrictEqual(h1.childNodes.length, 5)

      const [, span1, span2, mainComment] = h1.childNodes

      ok(span1 instanceof window.HTMLElement)
      ok(span1.tagName === "SPAN")
      ok(span1.textContent === "Test")

      ok(span2 instanceof window.HTMLElement)
      ok(span2.tagName === "SPAN")
      ok(span2.textContent === "Content")

      ok(isComment(mainComment)) // HOLE

      ok(main === elements.main)

      ok(div instanceof window.HTMLElement)
      ok(div.tagName === "DIV")
      ok(div.textContent === "Nested")
      ok(div === elements.div)

      ok(footer instanceof window.HTMLElement)
      ok(footer.tagName === "FOOTER")
      ok(footer.textContent === "Footer")
      ok(footer === elements.footer)
    }))
})
