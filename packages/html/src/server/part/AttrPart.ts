import * as Effect from '@effect/io/Effect'

import { BasePart } from './BasePart.js'

export class AttrPart extends BasePart<string | null> {
  readonly _tag = 'Attr' as const

  constructor(
    protected setAttribute: (value: string) => Effect.Effect<never, never, void>,
    protected removeAttribute: () => Effect.Effect<never, never, void>,
    index: number,
    value: string | null = null,
  ) {
    super(index, value)
  }

  protected getValue(value: unknown): string | null {
    if (value == null) return null

    return String(value)
  }

  protected setValue(value: string | null): Effect.Effect<never, never, void> {
    return Effect.suspend(() => {
      if (value === null) {
        return this.removeAttribute()
      } else {
        return this.setAttribute(value)
      }
    })
  }

  getHTML(): string {
    return this.value ?? ''
  }

  static fromElement(element: Element, name: string, index: number) {
    const setAttribute = (value: string) => Effect.sync(() => element.setAttribute(name, value))
    const removeAttribute = () => Effect.sync(() => element.removeAttribute(name))

    return new AttrPart(setAttribute, removeAttribute, index, element.getAttribute(name))
  }
}
