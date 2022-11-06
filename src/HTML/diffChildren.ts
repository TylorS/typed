import * as Effect from '@effect/core/io/Effect'
import udomdiff from 'udomdiff'

import { Document } from '../DOM/Document.js'

import { diffable } from './Wire.js'

export function diffChildren(
  comment: Comment,
  currentNodes: readonly Node[],
  nextNodes: readonly Node[],
) {
  return Effect.serviceWith(Document.Tag, (d) =>
    udomdiff(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      comment.parentNode!,
      currentNodes,
      nextNodes,
      diffable(d),
      comment,
    ),
  )
}
