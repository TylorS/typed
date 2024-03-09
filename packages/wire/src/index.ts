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
export const persistent = (document: Document, fragment: DocumentFragment): DocumentFragment | Node | Wire => {
  const { childNodes } = fragment
  const { length } = childNodes

  if (length === 0) return fragment
  if (length === 1) return childNodes[0]

  const firstChild = document.createComment("<>")
  const lastChild = document.createComment("</>")

  fragment.prepend(firstChild)
  fragment.append(lastChild)

  return {
    ELEMENT_NODE,
    DOCUMENT_FRAGMENT_NODE,
    nodeType,
    firstChild,
    lastChild,
    valueOf(): DocumentFragment {
      const nodes = getAllSiblingsBetween(firstChild, lastChild)

      if (fragment.childNodes.length !== nodes.length) {
        fragment.replaceChildren(...nodes)
      }

      return fragment
    }
  }
}

function getAllSiblingsBetween(start: Node, end: Node): Array<Node> {
  const siblings = [start]
  let node = start
  while (node && node !== end) {
    siblings.push(node)
    node = node.nextSibling as Node
  }
  siblings.push(end)
  return siblings
}

/**
 * When supporting a Wire for persisten document fragment behavior,
 * these are the kinds of values which can be rendered.
 * @since 1.0.0
 */
export type Rendered = Rendered.Value | ReadonlyArray<Rendered>

/**
 * @since 1.0.0
 */
export namespace Rendered {
  /**
   * When supporting a Wire for persisten document fragment behavior,
   * these are the kinds of values which can be rendered.
   * @since 1.0.0
   */
  export type Value = Node | DocumentFragment | Wire

  /**
   * Extract the values from a Rendered type
   * @since 1.0.0
   */
  export type Values<T extends Rendered> = [T] extends [ReadonlyArray<infer R>] ?
    ReadonlyArray<R | Exclude<T, ReadonlyArray<any>>>
    : ReadonlyArray<T>

  /**
   * Extract the elements from a Rendered type
   * @since 1.0.0
   */
  export type Elements<T extends Rendered> = ReadonlyArray<
    [Node] extends [Exclude<T, DocumentFragment | Wire | ReadonlyArray<Rendered>>] ? HTMLElement | SVGElement
      : Exclude<T, DocumentFragment | Wire | ReadonlyArray<Rendered>>
  >
}

/**
 * Check if a node is a Wire
 * @since 1.0.0
 */
export function isWire(node: Rendered): node is Wire {
  if (!isArray(node)) return node.nodeType === nodeType
  return false
}

/**
 * Check if a node is a Node
 * @since 1.0.0
 */
export function isNode(node: Rendered): node is Node {
  if (!isArray(node)) return node.nodeType !== node.DOCUMENT_FRAGMENT_NODE
  return false
}

/**
 * Check if a node is an Element
 * @since 1.0.0
 */
export function isElement(node: Rendered): node is Element {
  return isNode(node) && node.nodeType === node.ELEMENT_NODE
}

/**
 * Check if a node is an SvgElement
 * @since 1.0.0
 */
export function isSvgElement(node: Rendered): node is SVGElement {
  return isElement(node) && "ownerSVGElement" in node
}

/**
 * Check if a node is a HTMLEelement
 * @since 1.0.0
 */
export function isHtmlElement(node: Rendered): node is HTMLElement {
  return isElement(node) && !("ownerSVGElement" in node)
}

/**
 * Check if a node is a Text
 * @since 1.0.0
 */
export function isText(node: Rendered): node is Text {
  return isNode(node) && node.nodeType === node.TEXT_NODE
}

/**
 * Check if a node is an Attr
 * @since 1.0.0
 */
export function isAttr(node: Rendered): node is Attr {
  return isNode(node) && node.nodeType === node.ATTRIBUTE_NODE
}

/**
 * Check if a node is a Comment
 * @since 1.0.0
 */
export function isComment(node: Rendered): node is Comment {
  return isNode(node) && node.nodeType === node.COMMENT_NODE
}

/**
 * Check if a node is a DocumentFragment
 * @since 1.0.0
 */
export function isDocumentFragment(node: Rendered): node is DocumentFragment {
  if (!isArray(node)) return node.nodeType === node.DOCUMENT_FRAGMENT_NODE
  return false
}

/**
 * Check if is an Array of nodes
 * @since 1.0.0
 */
export function isArray(node: Rendered): node is ReadonlyArray<Rendered> {
  return Array.isArray(node)
}
