import { deepStrictEqual, ok } from 'assert'

import { Wire, persistent } from '@typed/wire'
import { describe, it } from 'vitest'

import { TYPED_HOLE } from '../meta.js'
import { Parser } from '../parser/parser.js'
import { makeServerWindow } from '../server/makeServerWindow.js'

import { buildTemplate } from './buildTemplate.js'

describe(buildTemplate.name, () => {
  const window = makeServerWindow()
  const tmpl = makeTmpl(window.document)

  it('builds a single element', () => {
    const div = tmpl`<div></div>`

    ok(div instanceof window.HTMLDivElement)
    deepStrictEqual(div.outerHTML, '<div></div>')
  })

  it('builds a single element with attributes', () => {
    const div = tmpl`<div id="test" class="test"></div>`

    ok(div instanceof window.HTMLDivElement)
    deepStrictEqual(div.outerHTML, '<div id="test" class="test"></div>')
  })

  it('builds a single element with boolean attributes', () => {
    const div = tmpl`<div hidden></div>`

    ok(div instanceof window.HTMLDivElement)
    deepStrictEqual(div.outerHTML, '<div hidden=""></div>')
  })

  it('builds a single element with data attributes', () => {
    const div = tmpl`<div data-test="test"></div>`

    ok(div instanceof window.HTMLDivElement)
    deepStrictEqual(div.outerHTML, '<div data-test="test"></div>')
  })

  it('builds a single element with text', () => {
    const div = tmpl`<div>test</div>`

    ok(div instanceof window.HTMLDivElement)
    deepStrictEqual(div.outerHTML, '<div>test</div>')
  })

  it('builds multiple elements', () => {
    const wire = tmpl`<div></div><div></div>`

    ok(wire.nodeType === 111)
    const fragment = (wire as Wire).valueOf()

    ok(fragment instanceof window.DocumentFragment)

    deepStrictEqual(fragment.children.length, 2)
    deepStrictEqual(fragment.children[0].outerHTML, '<div></div>')
    deepStrictEqual(fragment.children[1].outerHTML, '<div></div>')
  })

  it('builds elements with node parts', () => {
    const div = tmpl`<div>${'text'}</div>`

    ok(div instanceof window.HTMLDivElement)
    deepStrictEqual(div.outerHTML, `<div>${TYPED_HOLE(0)}</div>`)
  })

  it('builds elements with text parts', () => {
    const div = tmpl`<script>${'text'}</script>`

    ok(div instanceof window.HTMLElement)
    deepStrictEqual(div.outerHTML, `<script>${TYPED_HOLE(0)}</script>`)
  })

  it('builds self-closing elements', () => {
    const input = tmpl`<input disabled />`

    ok(input instanceof window.HTMLInputElement)
    deepStrictEqual(input.outerHTML, '<input disabled="">')
  })

  it('builds elements with attributes parts', () => {
    const div = tmpl`<div id="${'id'}"></div>`

    ok(div instanceof window.HTMLDivElement)

    // Attribute parts are added later
    deepStrictEqual(div.outerHTML, `<div></div>`)
  })

  it('builds svg elements', () => {
    const svg = tmpl`<svg><g></g></svg>`

    ok(svg instanceof window.SVGElement)
    deepStrictEqual(svg.outerHTML, '<svg><g></g></svg>')
  })

  it('builds svg elements with attributes', () => {
    const svg = tmpl`<svg width="100" height="100"><g></g></svg>`

    ok(svg instanceof window.SVGElement)
    deepStrictEqual(svg.outerHTML, '<svg width="100" height="100"><g></g></svg>')
  })

  it('builds svg elements with attributes parts', () => {
    const svg = tmpl`<svg width="${'100'}" height="${'100'}"><g></g></svg>`

    ok(svg instanceof window.SVGElement)
    deepStrictEqual(svg.outerHTML, '<svg><g></g></svg>')
  })
})

const parser = new Parser()

function makeTmpl(document: Document) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (strings: TemplateStringsArray, ..._: any[]) => {
    const template = parser.parse(strings)
    const fragment = buildTemplate(document, template)

    return persistent(fragment)
  }
}
