import type { Placeholder } from './Placeholder.js'

export interface Wire extends Placeholder<never, never, DocumentFragment> {
  readonly ELEMENT_NODE: 1
  readonly nodeType: 111
  readonly firstChild: Node | null
  readonly lastChild: Node | null
  readonly valueOf: () => DocumentFragment
}

const ELEMENT_NODE = 1
const nodeType = 111

const remove = ({ firstChild, lastChild }: Node, document: Document): Node => {
  const range = document.createRange()
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  range.setStartAfter(firstChild!)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  range.setEndAfter(lastChild!)
  range.deleteContents()
  return firstChild as Node
}

export const diffable =
  (document: Document) =>
  (node: Node, operation: number): Node | null => {
    if (node.nodeType !== nodeType) return node

    if (1 / operation < 0) {
      return operation ? remove(node, document) : node.lastChild
    }

    return operation ? (node.valueOf() as Node) : node.firstChild
  }

export const persistent = (fragment: DocumentFragment): DocumentFragment | Node | Wire => {
  const { childNodes } = fragment
  const { length } = childNodes

  if (length === 0) return fragment
  if (length === 1) return childNodes[0]

  const nodes = Array.from(childNodes)
  const firstChild = nodes[0]
  const lastChild = nodes[length - 1]

  return {
    __Placeholder__: {
      _R: (_) => _,
      _E: (_) => _,
      _A: (_) => _,
    },
    ELEMENT_NODE,
    nodeType,
    firstChild,
    lastChild,
    valueOf(): DocumentFragment {
      if (childNodes.length !== length) {
        let i = 0
        while (i < length) fragment.append(nodes[i++])
      }
      return fragment
    },
  }
}
