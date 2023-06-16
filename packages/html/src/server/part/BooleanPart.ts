import * as Effect from '@effect/io/Effect'

import { BasePart } from './BasePart.js'

export class BooleanPart extends BasePart<boolean> {
  readonly _tag = 'Boolean' as const

  constructor(
    protected toggleAttribute: (bool: boolean) => Effect.Effect<never, never, void>,
    index: number,
    value = false,
  ) {
    super(index, value)
  }

  protected getValue(value: unknown): boolean {
    return !!value
  }

  protected setValue(value: boolean): Effect.Effect<never, never, void> {
    return this.toggleAttribute(value)
  }

  getHTML(): string {
    return `${this.value}`
  }

  static fromElement(element: Element, name: string, index: number) {
    return new BooleanPart(
      (b) => Effect.sync(() => element.toggleAttribute(name, b)),
      index,
      element.hasAttribute(name),
    )
  }
}
