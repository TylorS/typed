import { BasePart } from './BasePart.js'

export class DataPart extends BasePart<void> {
  readonly _tag = 'Data'
  protected keys: string[] = []

  constructor(document: Document, readonly element: HTMLElement) {
    super(document)
  }

  /**
   * @internal
   */
  handle(value: unknown): void {
    if (!value) {
      this.keys.forEach((k) => delete this.element.dataset[k])
      this.keys = []
    } else if (!Array.isArray(value) && typeof value === 'object') {
      const keys = Object.keys(value)

      for (const key of this.keys) {
        if (!keys.includes(key)) {
          delete this.element.dataset[key]
        }
      }

      this.keys = keys

      keys.forEach((key) => {
        this.element.dataset[key] = String((value as Record<string, unknown>)[key])
      })
    }
  }
}
