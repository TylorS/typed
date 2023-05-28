import { BasePart } from './BasePart.js'

export class PropertyPart extends BasePart<void> {
  constructor(readonly node: Node, readonly propertyName: string) {
    super()
  }

  update(newValue: unknown) {
    ;(this.node as any)[this.propertyName] = newValue
  }
}
