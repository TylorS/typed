import { BasePart } from './BasePart.js'

export class ClassNamePart extends BasePart<void> {
  readonly _tag = 'ClassName'

  constructor(document: Document, readonly element: Element) {
    super(document)
  }

  /**
   * @internal
   */
  handle(newValue: unknown) {
    if (!newValue) {
      this.element.className = ''
    } else if (Array.isArray(newValue)) {
      this.element.className = newValue.flat().join(' ')
    } else {
      this.element.className = String(newValue)
    }
  }

  add(...classNames: readonly string[]) {
    this.element.classList.add(...classNames)
  }

  remove(...classNames: readonly string[]) {
    this.element.classList.remove(...classNames)
  }

  toggle(...classNames: readonly string[]) {
    classNames.forEach((className) => this.element.classList.toggle(className))
  }
}
