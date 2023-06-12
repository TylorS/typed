import { deepStrictEqual, ok } from 'assert'
import { fileURLToPath } from 'url'

import { describe, it } from 'vitest'

import { findCommentNode, getPreviousNodes } from './Entry.js'
import { makeTestDom } from './_test-utils.js'
import { findRootParentChildNodes, findTemplateResultParentChildNodes } from './hydrate.js'

describe(fileURLToPath(import.meta.url), () => {
  describe(findRootParentChildNodes.name, () => {
    const { body, render } = makeTestDom()
    const [rendered, { end }] = render(({ element }) => {
      const div = element('div', { id: 'test-div' }, -1)
      const p = div.element('p', { id: 'test-p' }, 0)
      const span = p.element('span', { id: 'test-span' }, 0)
      const text = span.text('lorem ipsum')

      span.comment('hole0')
      p.comment('hole0')
      div.comment('hole0')

      return {
        div,
        p,
        span,
        text,
      } as const
    })

    it('returns the expected elements', () => {
      const actual = findRootParentChildNodes(body)

      ok(actual.parentNode === body)
      ok(actual.childNodes.length === 2)
      ok(actual.childNodes[0] === rendered.div.node)
      ok(actual.childNodes[1] === end)
    })
  })

  describe(findTemplateResultParentChildNodes.name, () => {
    const { body, render } = makeTestDom()
    const [rendered] = render(({ element }) => {
      const div = element('div', { id: 'test-div' }, -1)
      const p = div.element('p', { id: 'test-p' }, 0)
      const span = p.element('span', { id: 'test-span' }, 0)
      const text = span.text('lorem ipsum')

      const spanComment = span.comment('hole0')
      const pComment = p.comment('hole0')
      const divComment = div.comment('hole0')

      return {
        div,
        divComment,
        p,
        pComment,
        span,
        spanComment,
        text,
      } as const
    })

    it('returns the expected elements', () => {
      const root = findRootParentChildNodes(body)
      const actual = findTemplateResultParentChildNodes(root, 0)

      ok(actual.parentNode === rendered.div.node)
      ok(actual.childNodes.length === 2)
      ok(actual.childNodes[0] === rendered.p.node)
      ok(actual.childNodes[1] === rendered.divComment)
    })

    it('returns the expected elements for children', () => {
      const root = findRootParentChildNodes(body)
      const parent = findTemplateResultParentChildNodes(root, 0)
      const actual = findTemplateResultParentChildNodes(parent, 0)

      ok(actual.parentNode === rendered.p.node)
      ok(actual.childNodes.length === 2)
      ok(actual.childNodes[0] === rendered.span.node)
      ok(actual.childNodes[1] === rendered.pComment)
    })

    it('returns the expected elements for text nodes', () => {
      const root = findRootParentChildNodes(body)
      const parent = findTemplateResultParentChildNodes(root, 0)
      const child = findTemplateResultParentChildNodes(parent, 0)
      const actual = findTemplateResultParentChildNodes(child, 0)

      ok(actual.parentNode === rendered.span.node)
      ok(actual.childNodes.length === 2)
      ok(actual.childNodes[0] === rendered.text)
      ok(actual.childNodes[1] === rendered.spanComment)
    })
  })

  describe(findCommentNode.name, () => {
    const { body, render } = makeTestDom()
    const [rendered, { end }] = render(({ element }) => {
      const div = element('div', { id: 'test-div' }, -1)
      const p = div.element('p', { id: 'test-p' }, 0)
      const span = p.element('span', { id: 'test-span' }, 0)
      const text = span.text('lorem ipsum')

      const spanComment = span.comment('hole0')
      const pComment = p.comment('hole0')
      const divComment = div.comment('hole0')

      return {
        div,
        divComment,
        p,
        pComment,
        span,
        spanComment,
        text,
      } as const
    })

    it('returns the expected comment node for root', () => {
      const root = findRootParentChildNodes(body)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const actual = findCommentNode(root.parentNode!.childNodes, 0)

      ok(actual === end)
    })

    it('returns the expected comment node for children', () => {
      const root = findRootParentChildNodes(body)
      const parent = findTemplateResultParentChildNodes(root, 0)
      const actual = findCommentNode(parent.childNodes, 0)

      ok(actual === rendered.divComment)
    })

    it('returns the expected comment node for grandchildren', () => {
      const root = findRootParentChildNodes(body)
      const parent = findTemplateResultParentChildNodes(root, 0)
      const child = findTemplateResultParentChildNodes(parent, 0)
      const actual = findCommentNode(child.childNodes, 0)

      ok(actual === rendered.pComment)
    })

    it('returns the expected comment node for text nodes', () => {
      const root = findRootParentChildNodes(body)
      const parent = findTemplateResultParentChildNodes(root, 0)
      const child = findTemplateResultParentChildNodes(parent, 0)
      const grandchild = findTemplateResultParentChildNodes(child, 0)
      const actual = findCommentNode(grandchild.childNodes, 0)

      ok(actual === rendered.spanComment)
    })
  })

  describe(getPreviousNodes.name, () => {
    const { render } = makeTestDom()
    const [rendered, { end }] = render(({ element }) => {
      const div = element('div', { id: 'test-div' }, -1)
      const p = div.element('p', { id: 'test-p' }, 0)
      const span = p.element('span', { id: 'test-span' }, 0)
      const text = span.text('lorem ipsum')

      const spanComment = span.comment('hole0')
      const pComment = p.comment('hole0')
      const divComment = div.comment('hole0')

      return {
        div,
        divComment,
        p,
        pComment,
        span,
        spanComment,
        text,
      } as const
    })

    it('returns the expected elements', () => {
      const root = getPreviousNodes(end, 0)

      deepStrictEqual(root, [rendered.div.node])

      const parent = getPreviousNodes(rendered.divComment, 0)

      deepStrictEqual(parent, [rendered.p.node])

      const child = getPreviousNodes(rendered.pComment, 0)

      deepStrictEqual(child, [rendered.span.node])

      const grandchild = getPreviousNodes(rendered.spanComment, 0)

      deepStrictEqual(grandchild, [rendered.text])
    })
  })
})
