import { sync } from '@effect/io/Effect'

import { BasePart } from './BasePart.js'
import { removeAttribute } from './templateHelpers.js'

export class DataPart extends BasePart<never, never> {
  readonly _tag = 'Data'
  protected keys: string[] = []

  constructor(document: Document, readonly element: HTMLElement) {
    super(document, Object.keys(element.dataset))
  }

  /**
   * @internal
   */
  handle(value: unknown) {
    return sync(() => {
      if (value && !Array.isArray(value) && typeof value === 'object') {
        const keys = Object.keys(value)

        // Remove old keys
        for (const key of this.keys) {
          if (!keys.includes(key)) {
            delete this.element.dataset[key]
          }
        }

        this.keys = keys

        // Set new keys
        Object.assign(this.element.dataset, value)
      } else {
        this.keys.forEach((k) => delete this.element.dataset[k])
        this.keys = []
      }
    })
  }

  /**
   * @internal
   */
  getHTML(template: string) {
    const { dataset } = this.element
    const keys = Object.keys(dataset)

    if (keys.length === 0) {
      return ''
    }

    return (
      removeAttribute('.data', template) +
      keys.reduce((acc, key) => {
        return acc + `data-${key}="${dataset[key]}" `
      }, '')
    )
  }
}
