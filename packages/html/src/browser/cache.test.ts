import { ok } from 'assert'

import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import { GlobalThis } from '@typed/dom'
import { describe, it } from 'vitest'

import { RenderContext, makeRenderContext } from '../RenderContext.js'
import { html } from '../RenderTemplate.js'
import { Renderable } from '../Renderable.js'
import { Parser } from '../parser/parser.js'
import { makeServerWindow } from '../server/makeServerWindow.js'
import { renderToHtml } from '../server/renderToHtml.js'

import {
  findPartComment,
  findRootChildNodes,
  findRootParentChildNodes,
  findTemplateResultPartChildNodes,
} from './cache.js'

const parser = new Parser()

describe(findRootChildNodes.name, () => {
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
    const actual = findRootChildNodes(body)

    ok(actual.length === 2)
    ok(actual[0] === rendered.div.node)
    ok(actual[1] === end)
  })
})

describe(findPartComment.name, () => {
  const testTemplate = Effect.gen(function* ($) {
    const spanTemplate = html`<span>${'lorem ipsum'}</span>`
    const pTemplate = html`<p id="test-p">${spanTemplate}</p>`

    const { window, body, rendered, template } = yield* $(
      testDomTemplate`<div id="test-div">${pTemplate}</div>`,
    )

    const div = rendered[0]

    ok(div instanceof window.HTMLDivElement)

    const divComment = div.childNodes[div.childNodes.length - 1]

    ok(divComment instanceof window.Comment)

    const p = div.childNodes[0]
    const span = p.childNodes[0]
    const pComment = p.childNodes[1]
    const textStartComment = span.childNodes[0]
    const text = span.childNodes[1]
    const spanComment = span.childNodes[2]

    return {
      window,
      body,
      div,
      divComment,
      divTemplate: template,
      p,
      pComment,
      pTemplate: parser.parse(pTemplate.template),
      span,
      spanComment,
      spanTemplate: parser.parse(spanTemplate.template),
      text,
      textStartComment,
    } as const
  })

  it('returns the expected comment node for root', async () => {
    const test = pipe(
      Effect.gen(function* ($) {
        const { body } = yield* $(testTemplate)

        const root = findRootParentChildNodes(body)
        const [actual] = findPartComment(root.childNodes, -1)

        ok(actual.nodeValue === 'typed-end')
      }),
    )

    await Effect.runPromise(test)
  })

  it('returns the expected comment node for children', async () => {
    const test = pipe(
      Effect.gen(function* ($) {
        const { body, divTemplate, divComment, pTemplate } = yield* $(testTemplate)

        const root = findRootParentChildNodes(body)
        const child = findTemplateResultPartChildNodes(root, divTemplate, pTemplate, 0)
        const [actual] = findPartComment(child.childNodes, 0)

        ok(actual === divComment)
      }),
    )

    await Effect.runPromise(test)
  })

  it('returns the expected comment node for grandchildren', async () => {
    const test = pipe(
      Effect.gen(function* ($) {
        const { body, divTemplate, pTemplate, pComment, spanTemplate } = yield* $(testTemplate)

        const root = findRootParentChildNodes(body)
        const child = findTemplateResultPartChildNodes(root, divTemplate, pTemplate, 0)
        const grandchild = findTemplateResultPartChildNodes(child, pTemplate, spanTemplate, 0)
        const [actual] = findPartComment(grandchild.childNodes, 0)

        ok(actual === pComment)
      }),
    )

    await Effect.runPromise(test)
  })

  it('returns the expected comment node for text nodes', async () => {
    const test = pipe(
      Effect.gen(function* ($) {
        const { body, divTemplate, pTemplate, spanTemplate, spanComment } = yield* $(testTemplate)

        const root = findRootParentChildNodes(body)
        const child = findTemplateResultPartChildNodes(root, divTemplate, pTemplate, 0)
        const grandchild = findTemplateResultPartChildNodes(child, pTemplate, spanTemplate, 0)
        const text = findTemplateResultPartChildNodes(grandchild, spanTemplate, null, 0)
        const [actual] = findPartComment(text.childNodes, 0)

        ok(actual === spanComment)
      }),
    )

    await Effect.runPromise(test)
  })
})

function testDomTemplate(strings: TemplateStringsArray, ...values: ReadonlyArray<Renderable>) {
  return pipe(
    html(strings, ...values),
    renderToHtml,
    Effect.map((html) => {
      const window = makeServerWindow()
      const { body } = window.document
      const template = parser.parse(strings)

      body.innerHTML = html

      const rendered = Array.from(window.document.body.children)

      return {
        window,
        body,
        template,
        html,
        rendered,
      } as const
    }),
    RenderContext.provide(makeRenderContext('test')),
    Effect.scoped,
  )
}

export function dom(document: Document, root: HTMLElement) {
  return {
    element: <
      const T extends keyof HTMLElementTagNameMap,
      const Attrs extends Readonly<Record<string, string>> = Record<never, never>,
    >(
      tag: T,
      attr: Attrs = {} as Attrs,
      id?: number,
    ) => {
      const rendered = elementWithAttr(document, tag, attr, String(id))

      root.append(rendered.node)

      return {
        ...rendered,
        ...dom(document, rendered.node),
      } as const
    },
    text: (text: string) => {
      const node = document.createTextNode(text)

      root.append(node)

      return node
    },
    comment: (text: string) => {
      const node = document.createComment(text)

      root.append(node)

      return node
    },
    hole: (index: number) => {
      const node = document.createComment(`hole${index}`)

      root.append(node)

      return node
    },
  }
}

function elementWithAttr<
  const T extends keyof HTMLElementTagNameMap,
  const Attrs extends Readonly<Record<string, string>>,
>(document: Document, tag: T, attr: Attrs, id?: string) {
  const node = document.createElement(tag)
  const attributes = Object.fromEntries(
    Object.entries(attr).map(([k, v]) => {
      if (k.startsWith('data-')) {
        node.dataset[k.slice(5)] = v

        return [k, v]
      } else {
        const attr = document.createAttributeNS(null, k)
        attr.value = v

        node.setAttributeNodeNS(attr)

        return [k, attr] as const
      }
    }),
  ) as {
    readonly [K in keyof Attrs]: K extends `data-${string}` ? string : Attr
  }

  if (id) {
    node.dataset.typed = id
  }

  return {
    node,
    attributes,
  } as const
}

export function makeTestDom(): {
  readonly window: Window & GlobalThis
  readonly document: Document
  readonly body: HTMLElement
  readonly render: <A>(
    f: (_: ReturnType<typeof dom>) => A,
  ) => readonly [A, { start: Comment; end: Comment }]
} {
  const window = makeServerWindow({ url: 'https://example.com' })

  function render<A>(f: (_: ReturnType<typeof dom>) => A): readonly [
    A,
    {
      start: Comment
      end: Comment
    },
  ] {
    const { document } = window

    document.body.innerHTML = ''

    const start = document.createComment('typed-start')
    const end = document.createComment('typed-end')

    document.body.appendChild(start)

    const a = f(dom(document, document.body))

    document.body.appendChild(end)

    return [a, { start, end }]
  }

  return {
    window,
    document: window.document,
    body: window.document.body,
    render,
  }
}
