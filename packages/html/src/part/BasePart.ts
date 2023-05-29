export abstract class BasePart<T> {
  abstract readonly _tag: string

  constructor(readonly document: Document, protected value: unknown = undefined) {}

  /**
   * @internal
   */
  abstract handle(value: unknown): T

  /**
   * @internal
   */
  getValue(value: unknown): unknown {
    return value
  }

  /**
   * Update the value of this part.
   */
  readonly update = (newValue: unknown): T | void => {
    const value = this.getValue(newValue)

    if (value === this.value) return
    this.value = value

    return this.handle(value)
  }
}
