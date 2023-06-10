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

export function holeToPart(document: Document, hole: TemplateHole, node: Node): Part {
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
