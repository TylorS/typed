import { diffable } from '@webreflection/uwire'
import udomdiff from 'udomdiff'

export function diffChildren(
  comment: Comment,
  currentNodes: readonly Node[],
  nextNodes: readonly Node[],
) {
  return udomdiff(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    comment.parentNode!,
    currentNodes,
    nextNodes,
    diffable,
    comment,
  )
}
