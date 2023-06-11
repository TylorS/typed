import { diffable } from '@typed/wire'
import udomdiff from 'udomdiff'

import { nodeToHtml } from './part/NodePart.js'

export function diffChildren(
  comment: Comment,
  currentNodes: Node[],
  nextNodes: Node[],
  document: Document,
) {
  console.log('diffing children')
  console.log(
    'parent',
    nodeToHtml(comment.parentNode!).replace((comment.parentNode as HTMLElement).innerHTML, '...'),
  )
  console.log(
    'current',
    currentNodes.filter((x) => x.nodeType !== x.DOCUMENT_FRAGMENT_NODE).map(nodeToHtml),
  )
  console.log('next', nextNodes.map(nodeToHtml))

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
