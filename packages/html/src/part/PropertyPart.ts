import { BasePart } from './BasePart.js'

export class PropertyPart extends BasePart<void> {
  readonly _tag = 'Property'

  constructor(document: Document, readonly node: Node, readonly propertyName: string) {
    super(document)
  }

  /**
   * @internal
   */
  handle(newValue: unknown) {
    ;(this.node as any)[this.propertyName] = newValue
  }
}
