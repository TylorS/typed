import { TemplateHole } from './TemplateCache.js'
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

export function holeToPart(
  document: Document,
  hole: TemplateHole,
  node: Node,
  getExistingNodes?: (comment: Comment) => Node[],
): Part {
  const element = node as HTMLElement

  switch (hole.type) {
    case 'node':
      return new NodePart(document, node as Comment, getExistingNodes?.(node as Comment))
    case 'text':
      return new TextPart(document, node)
    case 'attr':
      return new AttrPart(
        document,
        element,
        element.hasAttribute(hole.name)
          ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            element.getAttributeNode(hole.name)!
          : document.createAttributeNS(null, hole.name),
      )
    case 'boolean':
      return new BooleanPart(document, element, hole.name)
    case 'className':
      return new ClassNamePart(document, element)
    case 'data':
      return new DataPart(document, element)
    case 'property':
      return new PropertyPart(document, element, hole.name)
    case 'event':
      return new EventPart(document, element, hole.name)
    case 'ref':
      return new RefPart(document, element)
  }
}
