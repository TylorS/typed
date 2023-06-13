import * as Effect from '@effect/io/Effect'

import { BasePart } from './BasePart.js'
import { addQuotations } from './templateHelpers.js'

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export class ClassNamePart extends BasePart<never, never> {
  readonly _tag = 'ClassName'

  constructor(document: Document, readonly element: Element) {
    super(document, Array.from(element.classList))
  }

  getValue(value: unknown) {
    if (!value) {
      return []
    }

    if (Array.isArray(value)) {
      return value.filter(isString)
    }

    return String(value).split(' ')
  }

  /**
   * @internal
   */
  handle(newValue: string[]) {
    return Effect.sync(() => {
      const previous = this.value as string[]

      for (let i = 0; i < previous.length; ++i) {
        if (!newValue.includes(previous[i])) {
          this.element.classList.remove(previous[i])
        }
      }

      for (let i = 0; i < newValue.length; ++i) {
        if (!previous.includes(newValue[i])) {
          this.element.classList.add(newValue[i])
        }
      }

      this.value = newValue
    })
  }

  /**
   * @internal
   */
  getHTML(template: string) {
    const previous = template.replace(/className/i, 'class')

    return addQuotations(previous, this.element.className)
  }

  add(...classNames: readonly string[]) {
    this.element.classList.add(...classNames)
    return this.update(Array.from(this.element.classList))
  }

  remove(...classNames: readonly string[]) {
    this.element.classList.remove(...classNames)
    return this.update(Array.from(this.element.classList))
  }

  toggle(...classNames: readonly string[]) {
    classNames.forEach((className) => this.element.classList.toggle(className))
    return this.update(Array.from(this.element.classList))
  }
}
