import * as Effect from '@effect/io/Effect'

import { BasePart } from './BasePart.js'

export class PropertyPart extends BasePart<unknown> {
  readonly _tag = 'Property' as const

  constructor(
    protected setProperty: (value: unknown) => Effect.Effect<never, never, void>,
    index: number,
    value: unknown,
  ) {
    super(index, value)
  }

  protected getValue(value: unknown): unknown {
    return value
  }

  protected setValue(value: unknown) {
    return this.setProperty(value)
  }

  getHTML(): string {
    // TODO: Better formatting of values.
    return `${this.value}`
  }

  static fromElement(element: Element, name: string, index: number) {
    const setProperty = (value: unknown) =>
      Effect.sync(() => {
        ;(element as any)[name] = value
      })

    return new PropertyPart(setProperty, index, (element as any)[name])
  }
}
