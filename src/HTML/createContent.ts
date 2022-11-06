import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'

import { createDocumentFragment, createElement, createSvgElement } from '../DOM/Document.js'

export function createContent(
  innerHtml: string,
  svg: boolean,
): Effect.Effect<Document, never, DocumentFragment> {
  return svg ? createSvg(innerHtml) : createHtml(innerHtml)
}

export function createHtml(innerHtml: string): Effect.Effect<Document, never, DocumentFragment> {
  return pipe(
    createElement('template'),
    Effect.tap((t) => Effect.sync(() => (t.innerHTML = innerHtml))),
    Effect.map((t) => t.content),
  )
}

export function createSvg(innerHtml: string): Effect.Effect<Document, never, DocumentFragment> {
  return pipe(
    createDocumentFragment,
    Effect.tap((fragment) =>
      pipe(
        createSvgElement('svg'),
        Effect.tap((svg) =>
          Effect.sync(() => {
            svg.innerHTML = innerHtml
            fragment.append(...Array.from(svg.childNodes))
          }),
        ),
      ),
    ),
  )
}
