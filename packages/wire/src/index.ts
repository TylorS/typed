/**
 * Wire is a data type that serves as a DocumentFragment that can be
 * utilized to create a persistent DOM structure.
 * @since 1.0.0
 */

/**
 * Wire is a data type that serves as a DocumentFragment that can be
 * utilized to create a persistent DOM structure.
 * @since 1.0.0
 */
export interface Wire {
  readonly ELEMENT_NODE: 1
  readonly DOCUMENT_FRAGMENT_NODE: 11
  readonly nodeType: 111
  readonly firstChild: Node | null
  readonly lastChild: Node | null
  readonly valueOf: () => DocumentFragment
}

const ELEMENT_NODE = 1
const DOCUMENT_FRAGMENT_NODE = 11
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

/**
 * Create a diffable node from any Node which also might be a Wire.
 * @since 1.0.0
 */
export const diffable = (document: Document) => (node: Node, operation: number): Node => {
  if (node.nodeType !== nodeType) return node

  if (1 / operation < 0) {
    return operation ? remove(node, document) : (node.lastChild as Node)
  }

  return operation ? (node.valueOf() as Node) : (node.firstChild as Node)
}

/**
 * Create a Wire from a DocumentFragment only if it has more than one child.
 * otherwise return the first child.
 * @since 1.0.0
 */
export const persistent = (fragment: DocumentFragment): DocumentFragment | Node | Wire => {
  const { childNodes } = fragment
  const { length } = childNodes

  if (length === 0) return fragment
  if (length === 1) return childNodes[0]

  const nodes = Array.from(childNodes)
  const firstChild = nodes[0]
  const lastChild = nodes[length - 1]

  return {
    ELEMENT_NODE,
    DOCUMENT_FRAGMENT_NODE,
    nodeType,
    firstChild,
    lastChild,
    valueOf(): DocumentFragment {
      if (childNodes.length !== length) {
        let i = 0
        while (i < length) fragment.append(nodes[i++])
      }
      return fragment
    }
  }
}

export type Rendered = Rendered.Value | ReadonlyArray<Rendered>

export namespace Rendered {
  export type Value = Node | DocumentFragment | Wire

  export type Values<T extends Rendered> = [T] extends [ReadonlyArray<infer R>] ?
    ReadonlyArray<R | Exclude<T, ReadonlyArray<any>>>
    : ReadonlyArray<T>

  export type Elements<T extends Rendered> = [T] extends [ReadonlyArray<infer R>] ?
    ReadonlyArray<Exclude<R | Exclude<T, ReadonlyArray<any>>, DocumentFragment | Wire>>
    : ReadonlyArray<Exclude<T, DocumentFragment | Wire>>
}

/**
 * Check if a node is a Wire
 * @since 1.0.0
 */
export function isWire(node: Rendered): node is Wire {
  if (!Array.isArray(node)) return (node as Node | Document | Wire).nodeType === nodeType

  return false
}
