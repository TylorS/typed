import udomdiff from 'udomdiff'

import { diffable } from './Wire.js'

export function diffChildren(
  comment: Comment,
  currentNodes: Node[],
  nextNodes: Node[],
  document: Document,
) {
  return udomdiff(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    comment.parentNode!,
    // Document Fragments cannot be removed, so we filter them out
    currentNodes.filter((x) => x.nodeType !== x.DOCUMENT_FRAGMENT_NODE),
    nextNodes,
    diffable(document),
    comment,
  )
}
