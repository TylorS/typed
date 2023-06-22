import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'

import { Renderable } from '../Renderable.js'

import { BasePart } from './BasePart.js'
import { unwrapRenderable } from './updates.js'

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

  observe<R, E, R2>(
    placeholder: Renderable<R, E>,
    sink: Fx.Sink<R2, E, unknown>,
  ): Effect.Effect<R | R2 | Scope.Scope, never, void> {
    return Fx.drain(
      Fx.switchMatchCauseEffect(unwrapRenderable(placeholder), sink.error, this.update),
    )
  }

  static fromElement(element: Node, index: number) {
    const textNode = element.ownerDocument?.createTextNode('')
    const setText = (content: string) =>
      Effect.sync(() => (textNode ? (textNode.nodeValue = content) : null))

    return new TextPart(setText, index, '')
  }
}
