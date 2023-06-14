import { deepStrictEqual, ok, strictEqual } from 'assert'
import { fileURLToPath } from 'url'

import * as Duration from '@effect/data/Duration'
import * as Effect from '@effect/io/Effect'
import { GlobalThis } from '@typed/dom'
import * as Fx from '@typed/fx'
import { describe, expect, it } from 'vitest'

import { html } from './RenderTemplate.js'
import { testHydrate } from './_test-utils.js'
import { hydrate } from './hydrate.js'

describe(fileURLToPath(import.meta.url), () => {
  describe(hydrate.name, () => {
    it('hydrates a simple html element', async () => {
      const test = testHydrate(
        html`<div></div>`,
        ({ element }) => {
          const div = element('div', {}, -1)

          return div.node
        },
        // eslint-disable-next-line require-yield
        function* (_, initial, rendered) {
          expect(rendered).toEqual(initial)
        },
      )

      await Effect.runPromise(test)
    })

    it('hydrates an html element with attributes', async () => {
      const test = testHydrate(
        html`<div id=${'foo'}></div>`,
        ({ element }) => {
          const div = element('div', { id: 'initial' }, -1)

          return div.attributes.id
        },
        function* ($, attr, rendered) {
          const globalThis = yield* $(GlobalThis)

          ok(rendered instanceof globalThis.HTMLDivElement)

          const renderedAttr = rendered.getAttributeNodeNS(null, 'id')

          strictEqual(renderedAttr, attr)
        },
      )

      await Effect.runPromise(test)
    })

    it('hydrates nested templates', async () => {
      const exampleText = `lorem ipsum something something`
      const template = html`<div>${html`<p>${exampleText}</p>`}</div>`

      const test = testHydrate(
        template,
        ({ element }) => {
          const div = element('div', {}, -1)
          const p = div.element('p', {}, 0)

          const output = [div, p, p.text('')] as const

          p.hole(0)
          div.hole(0)

          return output
        },
        // eslint-disable-next-line require-yield
        function* (_, [div, p, text], root) {
          ok(root === div.node)

          const child = root.childNodes[0]

          ok(child === p.node)

          ok(child.childNodes[0] === text)
          deepStrictEqual(child.childNodes[0].nodeValue, exampleText)
        },
      )

      await Effect.runPromise(test)
    })

    it('hydrates multi-nested templates', async () => {
      const text = `lorem ipsum something something`
      const template = html`<div>${html`<p>${html`<span>${text}</span>`}</p>`}</div>`

      const test = testHydrate(
        template,
        ({ element }) => {
          const div = element('div', {}, -1)
          const p = div.element('p', {}, 0)
          const span = p.element('span', {}, 0)

          const output = [div, p, span, span.text(text)] as const

          span.hole(0)
          p.hole(0)
          div.hole(0)

          return output
        },
        // eslint-disable-next-line require-yield
        function* (_, [div, p, span, text], rendered) {
          ok(rendered === div.node)

          const child = rendered.childNodes[0]
          ok(child === p.node)

          const grandchild = child.childNodes[0]

          ok(grandchild === span.node)

          ok(grandchild.childNodes[0] === text)
        },
      )

      await Effect.runPromise(test)
    })

    it('hydrates templates with multiple children', async () => {
      const template = html`<div>${html`<p>1</p>`}${html`<p>2</p>`}</div>`

      const test = testHydrate(
        template,
        ({ element }) => {
          const div = element('div', {}, -1)
          const p1 = div.element('p', {}, 0)
          const p1Comment = div.hole(0)
          const p2 = div.element('p', {}, 1)
          const p2Comment = div.hole(1)

          const output = {
            div,
            p1: {
              node: p1.node,
              text: p1.text('1'),
              comment: p1Comment,
            },
            p2: {
              node: p2.node,
              text: p2.text('2'),
              comment: p2Comment,
            },
          } as const

          p2.hole(0)
          p1.hole(0)

          return output
        },
        // eslint-disable-next-line require-yield
        function* (_, initial, rendered) {
          ok(rendered === initial.div.node)

          ok(rendered.childNodes[0] === initial.p1.node)
          ok(rendered.childNodes[1] === initial.p1.comment)
          ok(rendered.childNodes[2] === initial.p2.node)
          ok(rendered.childNodes[3] === initial.p2.comment)
        },
      )

      await Effect.runPromise(test)
    })

    it(`hydrates root template with multiple child templates`, async () => {
      const template = html`${html`<p>1</p>`}${html`<p>2</p>`}`

      const test = testHydrate(
        template,
        ({ element, hole }) => {
          const p1 = element('p', {}, 0)
          const p1Hole = hole(0)
          const p2 = element('p', {}, 1)
          const p2Hole = hole(1)

          const output = {
            p1,
            p1Hole,
            p2,
            p2Hole,
          } as const

          return output
        },
        // eslint-disable-next-line require-yield
        function* (_, { p1, p1Hole, p2, p2Hole }, rendered) {
          ok(Array.isArray(rendered))

          ok(rendered[0] === p1.node)
          ok(rendered[1] === p1Hole)
          ok(rendered[2] === p2.node)
          ok(rendered[3] === p2Hole)
        },
      )

      await Effect.runPromise(test)
    })

    it(`allows root TemplateResult to change over time`, async () => {
      const template = Fx.mergeAll(
        html`<div>1</div>`,
        Fx.delay(html`<p>2</p>`, Duration.millis(100)),
        Fx.delay(html`<span>3</span>`, Duration.millis(200)),
      )

      const test = testHydrate(
        template,
        ({ element }) => {
          const div = element('div', {}, -1)
          const text = div.text('1')

          const output = {
            div,
            text,
          } as const

          return output
        },
        // eslint-disable-next-line require-yield
        function* ($, { div, text }, rendered, i) {
          const globalThis = yield* $(GlobalThis)

          ok(rendered instanceof globalThis.HTMLElement)

          if (i === 0) {
            ok(rendered === div.node)
            ok(rendered.childNodes.length === 1)
            ok(rendered.childNodes[0] === text)
          }

          if (i === 1) {
            ok(rendered.tagName === 'P')
            ok(rendered.textContent === '2')
          }

          if (i === 2) {
            ok(rendered.tagName === 'SPAN')
            ok(rendered.textContent === '3')
          }
        },
        undefined,
        3,
      )

      await Effect.runPromise(test)
    })

    it(`allows nested TemplateResults to change over time`, async () => {
      const template = html`<div>
        ${Fx.mergeAll(
          html`<p>1</p>`,
          Fx.delay(html`<span>2</span>`, Duration.millis(100)),
          Fx.delay(html`<span>3</span>`, Duration.millis(200)),
        )}
      </div>`

      const test = testHydrate(
        template,
        ({ element }) => {
          const div = element('div', {}, -1)
          const p = div.element('p', {}, 0)
          div.hole(0)

          const output = {
            div,
            p,
          } as const

          return output
        },
        // eslint-disable-next-line require-yield
        function* ($, { div, p }, rendered, i) {
          const globalThis = yield* $(GlobalThis)

          ok(rendered === div.node)

          if (i === 0) {
            ok(rendered.childNodes[0] === p.node)
          }

          if (i > 0) {
            ok(rendered.childNodes[0] instanceof globalThis.HTMLSpanElement)
            ok(rendered.childNodes[0].tagName === 'SPAN')
            ok(rendered.childNodes[0].textContent === String(i + 1))
          }
        },
      )

      await Effect.runPromise(test)
    })
  })

  it(`hydrates nested template with multiple child templates`, async () => {
    const template = html`<div>${html`<p>1</p>`}${html`<p>2</p>`}</div>
      <div>${html`<p>3</p>`}${html`<p>4</p>`}</div>`

    const test = testHydrate(
      template,
      ({ element }) => {
        const div1 = element('div', {}, -1)
        const p1 = div1.element('p', {}, 0)
        const p1Hole = div1.hole(0)
        const p2 = div1.element('p', {}, 1)
        const p2Hole = div1.hole(1)

        const div2 = element('div', {}, -1)
        const p3 = div2.element('p', {}, 2)
        const p3Hole = div2.hole(2)
        const p4 = div2.element('p', {}, 3)
        const p4Hole = div2.hole(3)

        const output = {
          div1,
          p1,
          p1Hole,
          p2,
          p2Hole,
          div2,
          p3,
          p3Hole,
          p4,
          p4Hole,
        } as const

        return output
      },
      // eslint-disable-next-line require-yield
      function* (_, { div1, div2, p1, p1Hole, p2, p2Hole, p3, p3Hole, p4, p4Hole }, rendered) {
        ok(Array.isArray(rendered))
        ok(rendered.length === 2)
        ok(rendered[0] === div1.node)

        ok(rendered[0].childNodes[0] === p1.node)
        ok(rendered[0].childNodes[1] === p1Hole)
        ok(rendered[0].childNodes[2] === p2.node)
        ok(rendered[0].childNodes[3] === p2Hole)

        ok(rendered[1] === div2.node)
        ok(rendered[1].childNodes[0] === p3.node)
        ok(rendered[1].childNodes[1] === p3Hole)
        ok(rendered[1].childNodes[2] === p4.node)
        ok(rendered[1].childNodes[3] === p4Hole)
      },
    )

    await Effect.runPromise(test)
  })
})
