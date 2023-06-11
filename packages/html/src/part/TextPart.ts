import { sync } from '@effect/io/Effect'

import { BasePart } from './BasePart.js'

export class TextPart extends BasePart<never, never> {
  readonly _tag = 'Text'

  constructor(document: Document, readonly node: Node) {
    super(document)
  }

  /**
   * @internal
   */
  handle(newValue: unknown) {
    return sync(() => {
      const textContent = newValue == null ? '' : String(newValue)

      if (this.node.textContent !== textContent) {
        this.node.textContent = textContent
      }
    })
  }

  /**
   * @internal
   */
  getHTML(template: string) {
    return `${template}${this.node.textContent || ''}`
  }
}
