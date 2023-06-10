import { persistent } from '@typed/wire'

import { Placeholder } from './Placeholder.js'
import { Renderable } from './Renderable.js'
import { TemplateCache, TemplateHole } from './TemplateCache.js'
import { getElementsFromRendered } from './getElementsFromRendered.js'
import { AttrPart } from './part/AttrPart.js'
import { BooleanPart } from './part/BooleanPart.js'
import { ClassNamePart } from './part/ClassNamePart.js'
import { DataPart } from './part/DataPart.js'
import { EventPart } from './part/EventPart.js'
import { NodePart } from './part/NodePart.js'
import { Part } from './part/Part.js'
import { PropertyPart } from './part/PropertyPart.js'
import { RefPart } from './part/RefPart.js'
import { TextPart } from './part/TextPart.js'
import { findPath } from './paths.js'
import { Rendered } from './render.js'

export function collectPartsAndValues<Values extends ReadonlyArray<Renderable<any, any>>>(
  document: Document,
  cache: TemplateCache,
  values: Values,
) {
  const partsToRenderable = new Map<
    Part<Placeholder.ResourcesOf<Values[number]>, Placeholder.ErrorsOf<Values[number]>>,
    Renderable<Placeholder.ResourcesOf<Values[number]>, Placeholder.ErrorsOf<Values[number]>>
  >()
  const fragment = document.importNode(cache.content, true)

  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    const hole = cache.holes[i]
    const node = findPath(fragment, hole.path)
    const part = holeToPart(document, hole, node)

    partsToRenderable.set(part, value)
  }

  let cached: Rendered

  const rendered = () => {
    return cached || (cached = persistent(fragment))
  }

  return {
    rendered,
    html() {
      return getElementsFromRendered(rendered())
        .map((e) => e.outerHTML)
        .join('')
    },
    partsToRenderable,
  } as const
}

function holeToPart(document: Document, hole: TemplateHole, node: Node): Part {
  switch (hole.type) {
    case 'node':
      return new NodePart(document, node as Comment)
    case 'text':
      return new TextPart(document, node)
    case 'attr':
      return new AttrPart(
        document,
        node as HTMLElement,
        document.createAttributeNS(null, hole.name),
      )
    case 'boolean':
      return new BooleanPart(document, node as HTMLElement, hole.name)
    case 'className':
      return new ClassNamePart(document, node as HTMLElement)
    case 'data':
      return new DataPart(document, node as HTMLElement)
    case 'property':
      return new PropertyPart(document, node as HTMLElement, hole.name)
    case 'event':
      return new EventPart(document, node as HTMLElement, hole.name)
    case 'ref':
      return new RefPart(document, node as HTMLElement)
  }
}
