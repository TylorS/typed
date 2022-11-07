import udomdiff from 'udomdiff'

import { diffable } from './Wire.js'

export function diffChildren(
  comment: Comment,
  currentNodes: readonly Node[],
  nextNodes: readonly Node[],
  document: Document,
) {
  return udomdiff(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    comment.parentNode!,
    currentNodes,
    nextNodes,
    diffable(document),
    comment,
  )
}
