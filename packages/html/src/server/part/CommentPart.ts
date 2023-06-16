import { sync } from '@effect/io/Effect'

import { BasePart } from './BasePart.js'

export class CommentPart extends BasePart<string | null> {
  readonly _tag = 'Comment' as const

  constructor(protected comment: Comment, index: number, value: string | null = null) {
    super(index, value)
  }

  protected getValue(value: unknown): string | null {
    if (value == null) return null

    return String(value)
  }

  protected setValue(value: string | null) {
    return sync(() => (this.comment.nodeValue = value))
  }

  getHTML(): string {
    return this.value ?? ''
  }

  static fromComment(comment: Comment, index: number) {
    return new CommentPart(comment, index, comment.nodeValue)
  }
}
