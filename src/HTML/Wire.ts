import { Placeholder } from './Placeholder.js'

export interface Wire extends Placeholder {
  readonly _tag: 'Wire'
  readonly ELEMENT_NODE: 1
  readonly nodeType: 111
  readonly firstChild: Node | null
  readonly lastChild: Node | null
  readonly valueOf: () => DocumentFragment
}

const ELEMENT_NODE = 1
const nodeType = 111

const remove = ({ firstChild, lastChild }: Node) => {
  const range = document.createRange()
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  range.setStartAfter(firstChild!)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  range.setEndAfter(lastChild!)
  range.deleteContents()
  return firstChild as Node
}

export const diffable = (node: Node, operation: number): Node | DocumentFragment | null =>
  node.nodeType === nodeType
    ? 1 / operation < 0
      ? operation
        ? remove(node)
        : node.lastChild
      : operation
      ? (node.valueOf() as Node | DocumentFragment)
      : node.firstChild
    : node

export const persistent = (fragment: DocumentFragment): Node | DocumentFragment | Wire => {
  const { childNodes } = fragment
  const { length } = childNodes
  if (length < 2) return length ? childNodes[0] : fragment
  const nodes = Array.prototype.slice.call(childNodes, 0)
  const firstChild = nodes[0]
  const lastChild = nodes[length - 1]

  return {
    _tag: 'Wire',
    _R: (_) => _,
    ELEMENT_NODE,
    nodeType,
    firstChild,
    lastChild,
    valueOf() {
      if (childNodes.length !== length) {
        fragment.append(...nodes)
      }
      return fragment
    },
  }
}
