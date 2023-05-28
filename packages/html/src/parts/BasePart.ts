export abstract class BasePart<T> {
  constructor(protected oldValue: unknown = undefined) {}

  abstract update(value: unknown): T

  getValue(value: unknown) {
    return value
  }

  handle = (newValue: unknown) => {
    const value = this.getValue(newValue)

    if (value === this.oldValue) return
    this.oldValue = value

    return this.update(value)
  }
}
