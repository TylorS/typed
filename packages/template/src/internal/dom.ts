import * as Effect from "effect/Effect";
import { isNullish, isObject } from "effect/Predicate";
import { CouldNotFindCommentError } from "../errors.js";
import { type EventHandler, fromEffectOrEventHandler, isEventHandler } from "../EventHandler.js";
import {
  type DomRenderEvent,
  type HtmlRenderEvent,
  isRenderEvent,
  type RenderEvent,
  RenderEventTypeId,
} from "../RenderEvent.js";
import { diffable, isComment } from "../Wire.js";
import { diff, insertOrMoveBefore } from "./diff.js";
import { renderToString } from "./encoding.js";

export function makeTextContentUpdater(element: Node) {
  return (value: unknown) => {
    element.textContent = renderToString(value, "");
  };
}

export function makeAttributeValueUpdater(element: HTMLElement | SVGElement, attr: Attr) {
  let isSet = false;
  const setValue = (value: string | null | undefined) => {
    if (isNullish(value)) {
      element.removeAttributeNS(attr.namespaceURI, attr.localName);
      isSet = false;
    } else {
      attr.value = value;
      if (isSet === false) {
        element.setAttributeNodeNS(attr);
        isSet = true;
      }
    }
  };

  return setValue;
}

export function makeClassListUpdater(element: HTMLElement | SVGElement) {
  // We do double-bookeeping such that we don't assume we know everything about the classList
  // Other DOM-based libraries might have additional classes in the classList, so we need to allow them to exist
  // outside of our control.
  let classList: ReadonlyArray<string> = [];
  return (classNames: ReadonlyArray<string>) => {
    const { added, removed } = diffStrings(classList, classNames);
    if (added.length > 0) {
      element.classList.add(...added);
    }
    if (removed.length > 0) {
      element.classList.remove(...removed);
    }
    classList = classNames;
  };
}

export function makeDatasetUpdater(element: HTMLElement | SVGElement) {
  // We do double-bookeeping such that we don't assume we know everything about the dataset
  // Other DOM-based libraries might have additional keys in the dataset, so we need to allow them to exist
  // outside of our control.
  const previous = new Map<string, string>();
  return (value: unknown) => {
    const current = new Map<string, string>();
    if (isObject(value)) {
      for (const [key, entry] of Object.entries(value)) {
        const name = `data-${key}`;
        if (isSafeDynamicKey(key) && isValidAttributeName(name)) {
          current.set(name, renderToString(entry, ""));
        }
      }
    }

    for (const name of previous.keys()) {
      if (!current.has(name)) element.removeAttribute(name);
    }
    for (const [name, entry] of current) {
      if (previous.get(name) !== entry || element.getAttribute(name) !== entry) {
        element.setAttribute(name, entry);
      }
    }

    previous.clear();
    for (const entry of current) previous.set(...entry);
  };
}

const forbiddenDynamicKeys = new Set(["__proto__", "prototype", "constructor"]);
const forbiddenAttributeNameCharacters = new Set(['"', "'", "/", ">", "=", "<"]);

function isSafeDynamicKey(key: string): boolean {
  return !forbiddenDynamicKeys.has(key);
}

function isValidAttributeName(name: string): boolean {
  if (name.length === 0) return false;
  for (const character of name) {
    const codePoint = character.codePointAt(0)!;
    if (
      codePoint <= 0x20 ||
      (codePoint >= 0x7f && codePoint <= 0x9f) ||
      forbiddenAttributeNameCharacters.has(character)
    ) {
      return false;
    }
  }
  return true;
}

export function diffStrings(
  previous: ReadonlyArray<string> | null | undefined,
  current: ReadonlyArray<string> | null | undefined,
): {
  added: ReadonlyArray<string>;
  removed: ReadonlyArray<string>;
  unchanged: ReadonlyArray<string>;
} {
  if (previous == null || previous.length === 0) {
    return {
      added: current || [],
      removed: [],
      unchanged: [],
    };
  } else if (current == null || current.length === 0) {
    return {
      added: [],
      removed: previous,
      unchanged: [],
    };
  } else {
    const previousSet = new Set(previous);
    const currentSet = new Set(current);
    const added = current.filter((c) => !previousSet.has(c));
    const removed: Array<string> = [];
    const unchanged: Array<string> = [];

    for (let i = 0; i < previous.length; ++i) {
      if (currentSet.has(previous[i])) {
        unchanged.push(previous[i]);
      } else {
        removed.push(previous[i]);
      }
    }

    return {
      added,
      removed,
      unchanged,
    };
  }
}

export function diffDataSet(
  a: Record<string, string | undefined> | null | undefined,
  b: Record<string, string | undefined> | null | undefined,
): { added: Array<readonly [string, string | undefined]>; removed: ReadonlyArray<string> } | null {
  if (!a) return b ? { added: Object.entries(b), removed: [] } : null;
  if (!b) return { added: [], removed: Object.keys(a) };

  const { added, removed, unchanged } = diffStrings(Object.keys(a), Object.keys(b));

  return {
    added: added.concat(unchanged).map((k) => [k, b[k]] as const),
    removed,
  };
}

export function getClassList(value: unknown): ReadonlyArray<string> {
  if (isNullish(value)) return [];
  if (Array.isArray(value)) return value.flatMap(getClassList);
  return splitClassNames(renderToString(value, ""));
}

const ASCII_SPACE_CODE = 32;

/**
 * Splits a string of class names (like those used in HTML `class=""` attributes)
 * into an array of individual class names (words), separated by whitespace.
 *
 * This function avoids creating intermediate arrays and unnecessary string copying by:
 *   - Scanning the string one character at a time
 *   - Skipping over all leading whitespace for each word
 *   - Collecting all consecutive non-whitespace characters as a "word"
 *   - Repeating until the input is exhausted
 *
 * All ASCII "whitespace" characters with code <= 32 are considered as delimiters.
 * This is more efficient than `String.prototype.trim` and `String.prototype.split(/\s+/)`
 * as it only allocates memory for the result array, not for intermediate or empty strings.
 *
 * Example:
 *    splitClassNames("  foo   bar\tbaz\nqux  ") // => ["foo", "bar", "baz", "qux"]
 */
export function splitClassNames(value: string): Array<string> {
  const result: Array<string> = [];
  let start = 0;
  const len = value.length;

  while (start < len) {
    // Skip leading whitespace (all ASCII <= 32)
    while (start < len && value.charCodeAt(start) <= ASCII_SPACE_CODE) start++;
    if (start >= len) break;
    // Find the end of the word (next whitespace)
    let end = start + 1;
    while (end < len && value.charCodeAt(end) > ASCII_SPACE_CODE) end++;
    result.push(value.slice(start, end));
    // Move start past the end of the last word (one char after end)
    start = end + 1;
  }

  return result;
}

export function matchNodeValue<A, B>(
  document: Document,
  value: unknown,
  onText: (text: string) => A,
  onNodes: (nodes: Array<Node>) => B,
): A | B {
  switch (typeof value) {
    // primitives are handled as text content
    case "string":
    case "symbol":
    case "number":
    case "bigint":
    case "boolean":
      return onText(String(value));
    case "undefined":
    case "function":
    case "object": {
      if (isNullish(value)) {
        return onNodes([]);
      } else if (isRenderEvent(value)) {
        return onNodes(unwrapRenderEvent(document, value));
      } else if (Array.isArray(value)) {
        return onNodes(value.flatMap((_) => renderEventToArray(document, _)));
      } else {
        return onNodes(renderEventToArray(document, value));
      }
    }
  }
}

export function renderEventToArray(document: Document, x: unknown): Array<Node> {
  switch (typeof x) {
    case "string":
    case "number":
    case "bigint":
    case "boolean":
    case "symbol":
      return [document.createTextNode(String(x))];
    case "undefined":
    case "function":
    case "object":
      if (isNullish(x)) return [];
      if (isRenderEvent(x)) return unwrapRenderEvent(document, x);
      if (Array.isArray(x)) return x.flatMap((_) => renderEventToArray(document, _));
      return [x as Node];
    default:
      return [];
  }
}

function unwrapRenderEvent(document: Document, x: RenderEvent): Array<Node> {
  if (x[RenderEventTypeId] === "dom") return unwrapDomRenderEvent(x);
  return unwrapHtmlRenderEvent(document, x);
}

function unwrapDomRenderEvent(x: DomRenderEvent): Array<Node> {
  const value = x.content;
  return Array.isArray(value) ? value : [value as Node];
}

function unwrapHtmlRenderEvent(document: Document, x: HtmlRenderEvent): Array<Node> {
  const tmp = document.createElement("template");
  tmp.innerHTML = x.html;
  return Array.from(tmp.childNodes);
}

export function diffChildren(
  comment: Node,
  currentNodes: Array<Node>,
  nextNodes: Array<Node>,
  get: (entry: Node, action: number) => Node,
) {
  const parent = comment.parentNode!;
  return diff(
    currentNodes,
    nextNodes,
    {
      first: (node) => get(node, 0),
      last: (node) => get(node, -0),
      insert: (node, before) => insertOrMoveBefore(parent, get(node, 1), before),
      remove: (node) => (get(node, -1) as ChildNode).remove(),
    },
    comment,
  );
}

const commentCache = new WeakMap<Element, Map<number, Comment>>();

function getCommentCacheKey(index: number, isEnd: boolean): number {
  return isEnd ? -index - 1 : index;
}

function findCommentInElement(parent: Element, index: number, isEnd: boolean): Comment {
  let cache = commentCache.get(parent);
  if (cache === undefined) {
    cache = new Map();
    commentCache.set(parent, cache);
  }

  const cacheKey = getCommentCacheKey(index, isEnd);
  const cached = cache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const childNodes = parent.childNodes;
  const searchValue = isEnd ? `/n_${index}` : `n_${index}`;

  for (let i = 0; i < childNodes.length; ++i) {
    const node = childNodes[i];
    if (isCommentWithValue(node, searchValue)) {
      cache.set(cacheKey, node);
      return node;
    }
  }

  throw new CouldNotFindCommentError(index);
}

export function findNodePartEndComment(parent: Element, index: number) {
  return findCommentInElement(parent, index, true);
}

export function findNodePartStartComment(parent: Element, index: number) {
  return findCommentInElement(parent, index, false);
}

function isCommentWithValue(node: Node, value: string): node is Comment {
  return isComment(node) && node.nodeValue === value;
}

export function makeNodeUpdater(
  document: Document,
  comment: Comment,
  text: Text | null = null,
  nodes: Array<Node> = [],
) {
  const element = comment.parentNode as HTMLElement | SVGElement;
  const get = diffable(document);
  const updateCommentText = (value: unknown) => {
    if (text === null) {
      text = document.createTextNode("");
      element.insertBefore(text, comment);
    }

    text.textContent = renderToString(value, "");
    nodes = diffChildren(comment, nodes, [text], get);
  };

  const updateNodes = (updatedNodes: Array<Node>) => {
    nodes = diffChildren(comment, nodes, updatedNodes, get);
  };

  return (value: unknown) => {
    matchNodeValue(document, value, updateCommentText, updateNodes);
  };
}

export function makeBooleanUpdater(element: HTMLElement | SVGElement, name: string) {
  return (value: boolean) => {
    element.toggleAttribute(name, value);
  };
}

export function getAttributeValue(value: unknown): string | null | undefined {
  if (isNullish(value)) return null;
  return renderToString(value, "");
}

export function getBooleanValue(value: unknown): boolean {
  return !!value;
}

export function getDatasetValue(
  value: unknown,
): Record<string, string | undefined> | null | undefined {
  if (isNullish(value)) return null;
  if (isObject(value)) return value as Record<string, string | undefined>;
  return null;
}

export function getEventHandlerValue<E, R>(
  value: unknown,
): EventHandler<Event, E, R> | null | undefined {
  if (isNullish(value)) return null;
  if (isEventHandler(value) || Effect.isEffect(value)) return fromEffectOrEventHandler(value);
  return null;
}
