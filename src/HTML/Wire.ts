import { Placeholder } from './Placeholder.js'

export interface Wire extends Placeholder {
  readonly ELEMENT_NODE: 1
  readonly nodeType: 111
  readonly firstChild: Node | null
  readonly lastChild: Node | null
  readonly valueOf: () => DocumentFragment
}

const ELEMENT_NODE = 1
const nodeType = 111

const remove = ({ firstChild, lastChild }: Node, document: Document): Node | null => {
  const range = document.createRange()
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  range.setStartAfter(firstChild!)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  range.setEndAfter(lastChild!)
  range.deleteContents()
  return firstChild
}

export const diffable = (document: Document) => (node: Node, operation: number) =>
  node.nodeType === nodeType
    ? 1 / operation < 0
      ? operation
        ? remove(node, document)
        : node.lastChild
      : operation
      ? (node.valueOf() as Node)
      : node.firstChild
    : node

export const persistent = (fragment: DocumentFragment): DocumentFragment | Node | Wire => {
  const { childNodes } = fragment
  const { length } = childNodes
  if (length < 2) return length ? childNodes[0] : fragment
  const nodes = Array.from(childNodes)
  const firstChild = nodes[0]
  const lastChild = nodes[length - 1]

  return {
    __Placeholder__: {
      _R: (_) => _,
    },
    ELEMENT_NODE,
    nodeType,
    firstChild,
    lastChild,
    valueOf() {
      if (childNodes.length !== length) {
        let i = 0
        while (i < length) fragment.appendChild(nodes[i++])
      }
      return fragment
    },
  }
}
