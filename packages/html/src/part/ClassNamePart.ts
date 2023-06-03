import * as Effect from '@effect/io/Effect'

import { BasePart } from './BasePart.js'
import { addQuotations } from './templateHelpers.js'

export class ClassNamePart extends BasePart<never, never> {
  readonly _tag = 'ClassName'

  constructor(document: Document, readonly element: Element) {
    super(document)
  }

  /**
   * @internal
   */
  handle(newValue: unknown) {
    // TODO: Diff class names
    return Effect.sync(() => {
      if (!newValue) {
        this.element.className = ''
      } else if (Array.isArray(newValue)) {
        this.element.className = newValue.flat().join(' ')
      } else {
        this.element.className = String(newValue)
      }
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
    return this.update(Array.from(this.element.classList).join(' '))
  }

  remove(...classNames: readonly string[]) {
    this.element.classList.remove(...classNames)
    return this.update(Array.from(this.element.classList).join(' '))
  }

  toggle(...classNames: readonly string[]) {
    classNames.forEach((className) => this.element.classList.toggle(className))
    return this.update(Array.from(this.element.classList).join(' '))
  }
}
