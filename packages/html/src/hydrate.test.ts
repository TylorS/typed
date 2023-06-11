import { ok } from 'assert'
import { fileURLToPath } from 'url'

import * as Effect from '@effect/io/Effect'
import { GlobalThis } from '@typed/dom'
import { describe, expect, it } from 'vitest'

import { html } from './RenderTemplate.js'
import { testHydrate } from './_test-utils.js'
import { hydrate } from './hydrate.js'
import { nodeToHtml } from './part/NodePart.js'

describe(fileURLToPath(import.meta.url), () => {
  describe(hydrate.name, () => {
    it('hydrates a simple html element', async () => {
      const test = testHydrate(
        html`<div></div>`,
        ({ element }) => {
          const div = element('div', {})

          return [div.node]
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
          const div = element('div', { id: 'initial' })

          return div.attributes.id
        },
        // eslint-disable-next-line require-yield
        function* ($, attr, rendered) {
          ok(Array.isArray(rendered))

          const [node] = rendered
          const globalThis = yield* $(GlobalThis)

          ok(node instanceof globalThis.HTMLDivElement)

          const renderedAttr = node.getAttributeNode('id')

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
          const div = element('div', { 'data-typed': '-1' })
          const p = div.element('p', { 'data-typed': '0' })

          const output = [div, p, p.text(text)] as const

          p.comment('hole0')

          div.comment('hole0')

          return output
        },
        // eslint-disable-next-line require-yield
        function* (_, [div, p, text], rendered) {
          ok(Array.isArray(rendered))

          const [root] = rendered

          ok(root === div.node)

          const child = root.childNodes[0]

          ok(child === p.node)

          ok(child.childNodes[0] === text)
        },
      )

      await Effect.runPromise(test)
    })

    it.only('hydrates multi-nested templates', async () => {
      const text = `lorem ipsum something something`
      const template = html`<div>${html`<p>${html`<span>${text}</span>`}</p>`}</div>`

      const test = testHydrate(
        template,
        ({ element }) => {
          const div = element('div', { 'data-typed': '-1' })
          const p = div.element('p', { 'data-typed': '0' })
          const span = p.element('span', { 'data-typed': '0' })

          const output = [div, p, span, span.text(text)] as const

          span.comment('hole0')
          p.comment('hole0')
          div.comment('hole0')

          return output
        },
        // eslint-disable-next-line require-yield
        function* (_, [div, p, span, text], rendered) {
          ok(Array.isArray(rendered))

          const [root] = rendered
          ok(root === div.node)

          console.log('root', nodeToHtml(root))

          const child = root.childNodes[0]
          ok(child === p.node)

          console.log('child', nodeToHtml(child))

          const grandchild = child.childNodes[0]

          ok(grandchild === span.node)

          ok(grandchild.childNodes[0] === text)
        },
      )

      await Effect.runPromise(test)
    })
  })
})
