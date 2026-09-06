/**
 * Wire is a data type that serves as a persistent, reusable DocumentFragment.
 *
 * Unlike a standard `DocumentFragment`, which empties itself when appended to the DOM,
 * a `Wire` retains references to its child nodes. This allows it to be moved around
 * the DOM or updated without losing track of its content.
 *
 * It is used internally to manage the lifecycle of template instances.
 *
 * @remarks
 * ## Why
 *
 * Multiple concrete nodes need one stable, movable identity after their source
 * `DocumentFragment` has been inserted and emptied. Boundary comments make that
 * range explicit without wrapping it in an extra element.
 *
 * ## Ownership and lifetime
 *
 * A Wire retains its exact boundary and child nodes but claims no ancestors or
 * external siblings. The render Scope decides when its range is moved or
 * removed; browser-owned state remains attached to the same nodes.
 *
 * @example
 * ```ts
 * import { persistent } from "@typed/template/Wire"
 *
 * // Wire is created internally by the template renderer
 * // It wraps DocumentFragments with multiple children
 * // to maintain references after DOM operations
 * ```
 *
 * @since 1.0.0
 * @category Persistent DOM ranges
 */
export interface Wire {
  /** Native Element node constant exposed for DOM-diff compatibility.
   *
   * @remarks
   * ## Why
   * Lets node algorithms treat Wire as a fragment-like DOM value.
   *
   * ## Ownership and lifetime
   * Immutable numeric metadata.
   *
   * @since 1.0.0
   * @category Persistent DOM ranges
   */
  readonly ELEMENT_NODE: 1;
  /** Native DocumentFragment node constant exposed for DOM-diff compatibility.
   *
   * @remarks
   * ## Why
   * Supports algorithms branching on fragment behavior.
   *
   * ## Ownership and lifetime
   * Immutable numeric metadata.
   *
   * @since 1.0.0
   * @category Persistent DOM ranges
   */
  readonly DOCUMENT_FRAGMENT_NODE: 11;
  /** Wire-specific node sentinel used by public guards and reconciliation.
   *
   * @remarks
   * ## Why
   * Distinguishes a transparent multi-node range from native Nodes.
   *
   * ## Ownership and lifetime
   * Immutable numeric metadata.
   *
   * @since 1.0.0
   * @category Persistent DOM ranges
   */
  readonly nodeType: 111;
  /** Opening boundary of the represented DOM range.
   *
   * @remarks
   * ## Why
   * Gives bounded diff and move operations an exact start.
   *
   * ## Ownership and lifetime
   * Borrowed node identity retained by the Wire.
   *
   * @since 1.0.0
   * @category Persistent DOM ranges
   */
  readonly firstChild: Node | null;
  /** Closing boundary of the represented DOM range.
   *
   * @remarks
   * ## Why
   * Gives bounded diff and move operations an exact end.
   *
   * ## Ownership and lifetime
   * Borrowed node identity retained by the Wire.
   *
   * @since 1.0.0
   * @category Persistent DOM ranges
   */
  readonly lastChild: Node | null;
  /** Current concrete nodes in the represented range.
   *
   * @remarks
   * ## Why
   * Reflects moves performed after the source fragment was inserted.
   *
   * ## Ownership and lifetime
   * Returns borrowed node identities in current DOM order.
   *
   * @since 1.0.0
   * @category Persistent DOM ranges
   */
  readonly childNodes: Array<Node>;
  /** Reassembles the current range as a DocumentFragment for native insertion.
   *
   * @remarks
   * ## Why
   * Native DOM insertion can move every represented node without a wrapper.
   *
   * ## Ownership and lifetime
   * Moves the Wire's exact nodes into its retained fragment; no clones are made.
   *
   * @since 1.0.0
   * @category Consuming range conversion
   */
  readonly valueOf: () => DocumentFragment;
}

const ELEMENT_NODE = 1;
const DOCUMENT_FRAGMENT_NODE = 11;
const nodeType = 111;

const remove = ({ firstChild, lastChild }: Node, document: Document): Node => {
  const range = document.createRange();

  range.setStartAfter(firstChild!);

  range.setEndAfter(lastChild!);
  range.deleteContents();
  return firstChild as Node;
};

/**
 * Creates the advanced node adapter used by local DOM reconciliation.
 *
 * @remarks
 * ## Why
 *
 * A Wire can participate in the same bounded diff as one Node while preserving
 * every concrete node in its range.
 *
 * ## Ownership and lifetime
 *
 * The closure borrows the `Document`; operations move or remove only the
 * represented range and acquire no Scope.
 *
 * @example
 * ```ts
 * import { diffable } from "@typed/template/Wire"
 *
 * const adapt = diffable(document)
 * ```
 *
 * @since 1.0.0
 * @category Range reconciliation
 * @stability internal-but-published
 */
export const diffable =
  (document: Document) =>
  (node: Node, operation: number): Node => {
    if (node.nodeType !== nodeType) return node;

    if (1 / operation < 0) {
      return operation ? remove(node, document) : (node.lastChild as Node);
    }

    return operation ? (node.valueOf() as Node) : (node.firstChild as Node);
  };

/**
 * Creates a Wire from a DocumentFragment.
 *
 * If the fragment has only one child, that child is returned directly.
 * If it has multiple children, they are wrapped in a `Wire` structure (bounded by comments)
 * to allow them to be treated as a single unit.
 *
 * @remarks
 * ## Why
 *
 * The renderer can move multi-node output without adding a layout-affecting
 * wrapper and without losing identity after fragment insertion.
 *
 * ## Ownership and lifetime
 *
 * The returned Node, fragment, or Wire contains the exact input children. The
 * caller's render Scope owns later insertion and removal.
 *
 * @example
 * ```ts
 * import { persistent } from "@typed/template/Wire"
 *
 * const templateIdentity = "unique-template-id-or-hash"
 * const output = persistent(document, templateIdentity, document.createDocumentFragment())
 * ```
 *
 * @since 1.0.0
 * @category Persistent DOM ranges
 */
export const persistent = (
  document: Document,
  templateHash: string,
  fragment: DocumentFragment,
): DocumentFragment | Node | Wire => {
  const { childNodes } = fragment;
  const { length } = childNodes;
  if (length === 0) return fragment;
  if (length === 1) return childNodes[0];
  const firstChild = document.createComment(`t_${templateHash}`);
  const lastChild = document.createComment(`/t_${templateHash}`);
  return fromComments(fragment, firstChild, lastChild);
};

/**
 * Creates a published advanced Wire from a fragment and exact boundary comments.
 *
 * @remarks
 * ## Why
 *
 * Hydration and renderer extensions may already know the correct range markers
 * and need to preserve them as one movable value.
 *
 * ## Ownership and lifetime
 *
 * The Wire retains the supplied nodes. It does not attach them or own their
 * parent; the consuming render Scope owns mutations.
 *
 * @example
 * ```ts
 * import { fromComments } from "@typed/template/Wire"
 *
 * const fragment = document.createDocumentFragment()
 * const start = document.createComment("start")
 * const end = document.createComment("end")
 * const wire = fromComments(fragment, start, end)
 * ```
 *
 * @since 1.0.0
 * @category Existing range boundaries
 * @stability internal-but-published
 */
export const fromComments = (
  fragment: DocumentFragment,
  firstChild: Comment,
  lastChild: Comment,
): Wire => {
  if (fragment.childNodes[0] !== firstChild) {
    fragment.prepend(firstChild);
  }
  if (fragment.childNodes[fragment.childNodes.length - 1] !== lastChild) {
    fragment.append(lastChild);
  }

  const getChildNodes = () => {
    const nodes = getAllSiblingsBetween(firstChild, lastChild);

    if (fragment.childNodes.length !== nodes.length) {
      fragment.append(firstChild, ...nodes, lastChild);
    }

    return nodes;
  };

  return {
    ELEMENT_NODE,
    DOCUMENT_FRAGMENT_NODE,
    nodeType,
    firstChild,
    lastChild,
    get childNodes() {
      return getChildNodes();
    },
    valueOf(): DocumentFragment {
      getChildNodes();
      return fragment;
    },
  };
};

/**
 * Gets all sibling nodes between exact range boundaries, excluding both markers.
 *
 * @remarks
 * ## Why
 *
 * Renderer extensions need a transparent view of a Wire or hydration range
 * without introducing a wrapper node.
 *
 * ## Ownership and lifetime
 *
 * The returned array borrows the existing nodes; it does not detach or retain
 * their parent.
 *
 * @example
 * ```ts
 * import { getAllSiblingsBetween } from "@typed/template/Wire"
 *
 * const parent = document.createElement("div")
 * const startComment = document.createComment("start")
 * const child = document.createElement("span")
 * const endComment = document.createComment("end")
 * parent.append(startComment, child, endComment)
 *
 * const nodes = getAllSiblingsBetween(startComment, endComment)
 * console.log(nodes[0] === child) // true
 * ```
 *
 * @since 1.0.0
 * @category Range traversal
 * @stability internal-but-published
 */
export function getAllSiblingsBetween(start: Node, end: Node): Array<Node> {
  const siblings = [];
  let node = start.nextSibling as Node;
  while (node && node !== end) {
    siblings.push(node);
    node = node.nextSibling as Node;
  }
  return siblings;
}

/**
 * A union type representing all possible rendered values.
 * Can be a single Node, a DocumentFragment, a Wire, or an array of these.
 *
 * @remarks
 * ## Why
 *
 * Renderer output can preserve arbitrary DOM shape and identity without forcing
 * a single wrapper element.
 *
 * ## Ownership and lifetime
 *
 * The type describes existing DOM values. Ownership stays with the producer and
 * the bounded render range that consumes them.
 *
 * @example
 * ```ts
 * import type { Rendered } from "@typed/template/Wire"
 *
 * // Rendered can be various DOM node types
 * const node: Rendered = document.createElement("div")
 * const fragment: Rendered = document.createDocumentFragment()
 * const array: Rendered = [node, fragment]
 * ```
 *
 * @since 1.0.0
 * @category Native output shapes
 */
export type Rendered = Rendered.Value | ReadonlyArray<Rendered>;

export namespace Rendered {
  /**
   * Single rendered value type.
   *
   * @remarks
   * ## Why
   *
   * This is the non-recursive leaf used by renderer integrations.
   *
   * ## Ownership and lifetime
   *
   * The alias owns no node.
   *
   * @since 1.0.0
   * @category Native output shapes
   */
  export type Value = Node | DocumentFragment | Wire;

  /**
   * Extract the values from a Rendered type
   *
   * @remarks
   * ## Why
   *
   * Renderer helpers can normalize scalar and array output at the type level.
   *
   * ## Ownership and lifetime
   *
   * This projection owns no values.
   *
   * @since 1.0.0
   * @category Native output shapes
   */
  export type Values<T extends Rendered> = [T] extends [ReadonlyArray<infer R>]
    ? ReadonlyArray<R | Exclude<T, ReadonlyArray<any>>>
    : ReadonlyArray<T>;

  /**
   * Extract the elements from a Rendered type
   *
   * @remarks
   * ## Why
   *
   * Event delegation and DOM helpers can expose only element-bearing output.
   *
   * ## Ownership and lifetime
   *
   * This projection owns no elements.
   *
   * @since 1.0.0
   * @category Native output shapes
   */
  export type Elements<T extends Rendered> = ReadonlyArray<
    [Node] extends [Exclude<T, DocumentFragment | Wire | ReadonlyArray<Rendered>>]
      ? HTMLElement | SVGElement
      : Exclude<T, DocumentFragment | Wire | ReadonlyArray<Rendered>>
  >;
}

/**
 * Checks if a rendered node is a `Wire`.
 *
 * @remarks
 * ## Why
 *
 * Wire ranges use a deliberate node-type sentinel rather than an extra wrapper.
 *
 * ## Ownership and lifetime
 *
 * The guard borrows the value and changes no DOM state.
 *
 * @example
 * ```ts
 * import { isWire } from "@typed/template/Wire"
 *
 * const result = isWire(document.createDocumentFragment())
 * ```
 *
 * @since 1.0.0
 * @category Range recognition
 */
export function isWire(node: Rendered): node is Wire {
  if (!isArray(node)) return node.nodeType === nodeType;
  return false;
}

/**
 * Checks if a rendered node is a standard DOM `Node`.
 *
 * @remarks
 * ## Why
 *
 * This excludes arrays and fragment-like Wire values before native node logic.
 *
 * ## Ownership and lifetime
 *
 * The check borrows the candidate only long enough to read its native
 * `nodeType`; it neither inserts nor retains the Node.
 *
 * @example
 * ```ts
 * import { isNode } from "@typed/template/Wire"
 *
 * const result = isNode(document.createTextNode("hello"))
 * ```
 *
 * @since 1.0.0
 * @category Native node recognition
 */
export function isNode(node: Rendered): node is Node {
  if (!isArray(node)) return node.nodeType !== node.DOCUMENT_FRAGMENT_NODE;
  return false;
}

/**
 * Checks if a rendered node is an `Element`.
 *
 * @remarks
 * ## Why
 *
 * Element-only operations remain expressed through native DOM types.
 *
 * ## Ownership and lifetime
 *
 * The check borrows the candidate for a native element-kind test and does not
 * claim or retain the Element.
 *
 * @example
 * ```ts
 * import { isElement } from "@typed/template/Wire"
 *
 * const result = isElement(document.createElement("div"))
 * ```
 *
 * @since 1.0.0
 * @category Native element recognition
 */
export function isElement(node: Rendered): node is Element {
  return isNode(node) && node.nodeType === node.ELEMENT_NODE;
}

/**
 * Checks if a rendered node is an `SVGElement`.
 *
 * @remarks
 * ## Why
 *
 * SVG namespace behavior stays visible to renderer extensions.
 *
 * ## Ownership and lifetime
 *
 * The check reads the candidate's native SVG identity without cloning,
 * inserting, or retaining it.
 *
 * @example
 * ```ts
 * import { isSvgElement } from "@typed/template/Wire"
 *
 * const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
 * const result = isSvgElement(svg)
 * ```
 *
 * @since 1.0.0
 * @category Native element recognition
 */
export function isSvgElement(node: Rendered): node is SVGElement {
  return isElement(node) && "ownerSVGElement" in node;
}

/**
 * Checks if a rendered node is an `HTMLElement`.
 *
 * @remarks
 * ## Why
 *
 * HTML-specific behavior can be selected without obscuring native DOM identity.
 *
 * ## Ownership and lifetime
 *
 * The check reads the candidate's native HTML identity without cloning,
 * inserting, or retaining it.
 *
 * @example
 * ```ts
 * import { isHtmlElement } from "@typed/template/Wire"
 *
 * const result = isHtmlElement(document.createElement("dialog"))
 * ```
 *
 * @since 1.0.0
 * @category Native element recognition
 */
export function isHtmlElement(node: Rendered): node is HTMLElement {
  return isElement(node) && !("ownerSVGElement" in node);
}

/**
 * Checks if a rendered node is a `Text` node.
 *
 * @remarks
 * ## Why
 *
 * Text serialization and direct text updates use the native node kind.
 *
 * ## Ownership and lifetime
 *
 * The check borrows the native Text node and does not mutate or retain its
 * character data.
 *
 * @example
 * ```ts
 * import { isText } from "@typed/template/Wire"
 *
 * const result = isText(document.createTextNode("hello"))
 * ```
 *
 * @since 1.0.0
 * @category Native node recognition
 */
export function isText(node: Rendered): node is Text {
  return isNode(node) && node.nodeType === node.TEXT_NODE;
}

/**
 * Checks if a rendered node is an `Attr` node.
 *
 * @remarks
 * ## Why
 *
 * Advanced renderer utilities may handle native attribute nodes explicitly.
 *
 * ## Ownership and lifetime
 *
 * The check borrows the native Attr node and does not attach it to an Element
 * or retain its owner.
 *
 * @example
 * ```ts
 * import { isAttr } from "@typed/template/Wire"
 *
 * const result = isAttr(document.createAttribute("aria-label"))
 * ```
 *
 * @since 1.0.0
 * @category Native node recognition
 */
export function isAttr(node: Rendered): node is Attr {
  return isNode(node) && node.nodeType === node.ATTRIBUTE_NODE;
}

/**
 * Checks if a rendered node is a `Comment` node.
 *
 * @remarks
 * ## Why
 *
 * Typed uses native comments as transparent dynamic and hydration boundaries.
 *
 * ## Ownership and lifetime
 *
 * The check borrows the native Comment node and does not treat it as a
 * renderer-owned boundary merely because it is a comment.
 *
 * @example
 * ```ts
 * import { isComment } from "@typed/template/Wire"
 *
 * const result = isComment(document.createComment("boundary"))
 * ```
 *
 * @since 1.0.0
 * @category Native node recognition
 */
export function isComment(node: Rendered): node is Comment {
  return isNode(node) && node.nodeType === node.COMMENT_NODE;
}

/**
 * Checks if a rendered node is a `DocumentFragment`.
 *
 * @remarks
 * ## Why
 *
 * Fragment output is distinguished from persistent Wire ranges before insertion.
 *
 * ## Ownership and lifetime
 *
 * The check borrows the native DocumentFragment; it does not insert its
 * children or consume the fragment.
 *
 * @example
 * ```ts
 * import { isDocumentFragment } from "@typed/template/Wire"
 *
 * const result = isDocumentFragment(document.createDocumentFragment())
 * ```
 *
 * @since 1.0.0
 * @category Native node recognition
 */
export function isDocumentFragment(node: Rendered): node is DocumentFragment {
  if (!isArray(node)) return node.nodeType === node.DOCUMENT_FRAGMENT_NODE;
  return false;
}

/**
 * Checks if a rendered value is an array of nodes.
 *
 * @remarks
 * ## Why
 *
 * Recursive Rendered collections can be normalized without wrapper nodes.
 *
 * ## Ownership and lifetime
 *
 * The check borrows the array container and does not traverse, flatten, or
 * retain its Rendered entries.
 *
 * @example
 * ```ts
 * import { isArray } from "@typed/template/Wire"
 *
 * const result = isArray([document.createTextNode("hello")])
 * ```
 *
 * @since 1.0.0
 * @category Output collection recognition
 */
export function isArray(node: Rendered): node is ReadonlyArray<Rendered> {
  return Array.isArray(node);
}

/**
 * Converts a `Rendered` value to an HTML string.
 *
 * @remarks
 * ## Why
 *
 * DOM integrations can expose a diagnostic/string representation while
 * preserving their concrete nodes for DOM consumers.
 *
 * ## Ownership and lifetime
 *
 * Serialization reads the current DOM and neither moves nor retains nodes. It
 * is not the streaming SSR renderer and does not sanitize existing markup.
 *
 * @example
 * ```ts
 * import { toHtml } from "@typed/template/Wire"
 *
 * const div = document.createElement("div")
 * div.textContent = "Hello"
 * const html = toHtml(div) // "<div>Hello</div>"
 *
 * const fragment = document.createDocumentFragment()
 * fragment.appendChild(div)
 * const fragmentHtml = toHtml(fragment) // "<div>Hello</div>"
 * ```
 *
 * @since 1.0.0
 * @category DOM serialization
 */
export function toHtml(node: Rendered): string {
  if (isArray(node)) return node.map(toHtml).join("");
  if (isWire(node)) return toHtml(node.valueOf());
  if (isElement(node)) return node.outerHTML;
  if (isText(node)) return node.data;
  if (isComment(node)) return `<!--${node.data}-->`;
  if (isDocumentFragment(node)) return Array.from(node.childNodes ?? [], toHtml).join("");
  return node.nodeValue || "";
}

/**
 * Extracts all Elements from a `Rendered` value.
 *
 * @remarks
 * ## Why
 *
 * Delegated native events attach to the concrete element roots represented by
 * arrays, fragments, and Wires.
 *
 * ## Ownership and lifetime
 *
 * The returned array borrows exact Element objects; it does not clone or own
 * them.
 *
 * @example
 * ```ts
 * import { getElements } from "@typed/template/Wire"
 *
 * const div = document.createElement("div")
 * const span = document.createElement("span")
 * const fragment = document.createDocumentFragment()
 * fragment.appendChild(div)
 * fragment.appendChild(span)
 *
 * const elements = getElements(fragment)
 * console.log(elements.length) // 2
 * ```
 *
 * @since 1.0.0
 * @category Rendered element traversal
 */
export function getElements(node: Rendered): Array<Element> {
  if (isArray(node)) return node.flatMap(getElements);
  if (isWire(node)) return getElements(node.valueOf());
  if (isElement(node)) return [node];
  if (isDocumentFragment(node)) return Array.from(node.childNodes ?? []).flatMap(getElements);
  return [];
}
