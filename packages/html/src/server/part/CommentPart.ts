import * as Effect from '@effect/io/Effect'
import { Sink } from '@typed/fx'

import { handlePart } from '../updates.js'

import { BasePart } from './BasePart.js'

import { Placeholder } from '@typed/html/Placeholder.js'

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
    placeholder: Placeholder<R, E, unknown>,
    sink: Sink<R2, E, unknown>,
  ): Effect.Effect<R | R2, never, void> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const part = this

    return Effect.catchAllCause(
      Effect.gen(function* (_) {
        const fx = yield* _(handlePart(part, placeholder))

        if (fx) {
          yield* _(fx.run(sink))
        } else {
          yield* _(sink.event(part.value))
        }
      }),
      sink.error,
    )
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
}
