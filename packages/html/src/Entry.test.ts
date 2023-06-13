import { deepStrictEqual, ok } from 'assert'
import { fileURLToPath } from 'url'

import { describe, it } from 'vitest'

import { findCommentNode, getPreviousNodes, isElement } from './Entry.js'
import { makeTestDom } from './_test-utils.js'
import { findRootParentChildNodes } from './hydrate.js'
import { ParentChildNodes } from './paths.js'

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
      const [actual] = findCommentNode(root.parentNode!.childNodes, 0)

      ok(actual === end)
    })

    it('returns the expected comment node for children', () => {
      const root = findRootParentChildNodes(body)
      const parent = findTemplateResultParentChildNodes(root, 0)
      const [actual] = findCommentNode(parent.childNodes, 0)

      ok(actual === rendered.divComment)
    })

    it('returns the expected comment node for grandchildren', () => {
      const root = findRootParentChildNodes(body)
      const parent = findTemplateResultParentChildNodes(root, 0)
      const child = findTemplateResultParentChildNodes(parent, 0)
      const [actual] = findCommentNode(child.childNodes, 0)

      ok(actual === rendered.pComment)
    })

    it('returns the expected comment node for text nodes', () => {
      const root = findRootParentChildNodes(body)
      const parent = findTemplateResultParentChildNodes(root, 0)
      const child = findTemplateResultParentChildNodes(parent, 0)
      const grandchild = findTemplateResultParentChildNodes(child, 0)
      const [actual] = findCommentNode(grandchild.childNodes, 0)

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

function findTemplateResultParentChildNodes(
  { childNodes }: ParentChildNodes,
  index: number,
): ParentChildNodes {
  let start = 0

  for (let i = 0; i < childNodes.length; i++) {
    const node = childNodes[i]

    if (isElement(node) && node.dataset.typed === index.toString()) {
      start = i
    }
  }

  const parentNode = childNodes[start]

  const parentChildNodes: ParentChildNodes = {
    parentNode,
    childNodes: parentNode.childNodes,
  }

  return parentChildNodes
}
