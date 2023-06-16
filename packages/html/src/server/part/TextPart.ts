import * as Effect from '@effect/io/Effect'

import { BasePart } from './BasePart.js'

export class TextPart extends BasePart<string> {
  readonly _tag = 'Text' as const

  constructor(
    protected setText: (content: string) => Effect.Effect<never, never, void>,
    index: number,
    value: string,
  ) {
    super(index, value)
  }

  protected getValue(value: unknown): string {
    if (value == null) return ''

    return String(value)
  }

  protected setValue(value: string) {
    return this.setText(value)
  }

  getHTML(): string {
    return this.value ?? ''
  }

  static fromElement(element: Node, index: number) {
    const textNode = element.ownerDocument?.createTextNode('')
    const setText = (content: string) =>
      Effect.sync(() => (textNode ? (textNode.nodeValue = content) : null))

    return new TextPart(setText, index, '')
  }
}
