import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import { Sink } from '@typed/fx'

import { Renderable } from '../Renderable.js'
import { findHoleComment } from '../utils.js'

import { BasePart } from './BasePart.js'
import { handlePart } from './updates.js'

export class CommentPart extends BasePart<string | null> {
  readonly _tag = 'Comment' as const

  constructor(
    protected setComment: (value: string) => Effect.Effect<never, never, void>,
    index: number,
    value: string | null = null,
  ) {
    super(index, value)
  }

  protected getValue(value: unknown): string | null {
    if (value == null) return null

    return String(value)
  }

  protected setValue(value: string | null) {
    return this.setComment(value ?? '')
  }

  observe<R, E, R2>(
    placeholder: Renderable<R, E>,
    sink: Sink<R2, E, unknown>,
  ): Effect.Effect<R | R2 | Scope.Scope, never, void> {
    return Effect.matchCauseEffect(handlePart(this, placeholder), {
      onFailure: sink.error,
      onSuccess: (fx) => (fx ? Effect.forkScoped(fx.run(sink)) : sink.event(this.value)),
    })
  }

  static fromComment(comment: Comment, index: number) {
    return new CommentPart(
      (value) =>
        Effect.sync(() => {
          comment.nodeValue = value
        }),
      index,
      comment.nodeValue,
    )
  }

  static fromParentElement(element: Element, index: number) {
    return CommentPart.fromComment(findHoleComment(element, index), index)
  }
}
