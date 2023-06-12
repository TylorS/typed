import { ok } from 'assert'
import { fileURLToPath } from 'url'

import * as Effect from '@effect/io/Effect'
import { GlobalThis } from '@typed/dom'
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

          const renderedAttr = rendered.getAttributeNode('id')

          ok(renderedAttr === attr)
        },
      )

      await Effect.runPromise(test)
    })

    it('hydrates nested templates', async () => {
      const text = `lorem ipsum something something`
      const template = html`<div>${html`<p>${text}</p>`}</div>`

      const test = testHydrate(
        template,
        ({ element }) => {
          const div = element('div', {}, -1)
          const p = div.element('p', {}, 0)

          const output = [div, p, p.text(text)] as const

          p.comment('hole0')

          div.comment('hole0')

          return output
        },
        // eslint-disable-next-line require-yield
        function* (_, [div, p, text], root) {
          ok(root === div.node)

          const child = root.childNodes[0]

          ok(child === p.node)

          ok(child.childNodes[0] === text)
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
          hole(0)
          const p2 = element('p', {}, 1)
          hole(1)

          const output = {
            p1: {
              node: p1.node,
            },
            p2: {
              node: p2.node,
            },
          } as const

          return output
        },
        // eslint-disable-next-line require-yield
        function* (_, { p1, p2 }, rendered) {
          ok(Array.isArray(rendered))

          ok(rendered[0] === p1.node)
          ok(rendered[1] === p2.node)
        },
      )

      await Effect.runPromise(test)
    })
  })
})
