import { sync } from '@effect/io/Effect'
import escape from 'escape-html'

import { BasePart } from './BasePart.js'
import { addQuotations } from './templateHelpers.js'

export class PropertyPart extends BasePart<never, never> {
  readonly _tag = 'Property'

  constructor(document: Document, readonly node: Node, readonly propertyName: string) {
    super(document, node[propertyName as keyof typeof node])
  }

  /**
   * @internal
   */
  handle(newValue: unknown) {
    return sync(() => {
      ;(this.node as any)[this.propertyName] = newValue
    })
  }

  getHTML(template: string): string {
    const previous = template.replace(`.${this.propertyName}`, this.propertyName)

    return addQuotations(previous, escape(JSON.stringify(this.value)))
  }
}
