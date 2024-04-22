import * as Fx from "@typed/fx"
import type { Scope } from "effect"
import { Effect } from "effect"
import { identity } from "effect/Function"
import type { AttrPartNode, ClassNamePartNode, CommentPartNode, PartNode, TextNode } from "../../Template.js"
import { convertCharacterEntities } from "../character-entities.js"
import {
  AttributePartImpl,
  BooleanPartImpl,
  ClassNamePartImpl,
  CommentPartImpl,
  DataPartImpl,
  NodePartImpl,
  PropertyPartImpl,
  splitClassNames,
  TextPartImpl
} from "./sync-parts.js"
import type { SyncPart } from "./SyncPart.js"

import { diffable, isComment } from "@typed/wire"
import udomdiff from "udomdiff"
import { isRenderEvent } from "../../RenderEvent.js"
import { isCommentWithValue } from "../utils.js"

export function makeAttributePart(
  index: number,
  element: HTMLElement | SVGElement,
  attr: Attr
) {
  const setValue = makeAttributeValueSetter(element, attr)
  return new AttributePartImpl(attr.name, index, ({ value }) => setValue(value), attr.value)
}

export function makeAttributeValueSetter(element: HTMLElement | SVGElement, attr: Attr) {
  let isSet = false
  const setValue = (value: string | null | undefined) => {
    if (isNullOrUndefined(value)) {
      element.removeAttribute(attr.name)
      isSet = false
    } else {
      attr.value = value
      if (isSet === false) {
        element.setAttributeNode(attr)
        isSet = true
      }
    }
  }

  return setValue
}

export function makeBooleanAttributePart(
  name: string,
  index: number,
  element: HTMLElement | SVGElement
) {
  return new BooleanPartImpl(
    name,
    index,
    ({ value }) => element.toggleAttribute(name, value === true),
    element.hasAttribute(name)
  )
}

export function makeClassNamePart(
  index: number,
  element: HTMLElement | SVGElement,
  initial: ReadonlyArray<string> = Array.from(element.classList)
) {
  return new ClassNamePartImpl(
    index,
    ({ previous, value }) => {
      const { added, removed } = diffStrings(previous, value)
      element.classList.add(...added)
      element.classList.remove(...removed)
    },
    initial
  )
}

export function makeDataPart(index: number, element: HTMLElement | SVGElement) {
  return new DataPartImpl(
    index,
    ({ previous, value }) => {
      const diff = diffDataSet(previous, value)
      if (diff) {
        const { added, removed } = diff
        removed.forEach((k) => delete element.dataset[k])
        added.forEach(([k, v]) => element.dataset[k] = v)
      }
    },
    element.dataset
  )
}

export function makePropertyPart(name: string, index: number, element: HTMLElement | SVGElement) {
  return new PropertyPartImpl(
    name,
    index,
    ({ value }) => {
      ;(element as any)[name] = value
    },
    element[name as keyof typeof element]
  )
}

export function makeTextPart(index: number, text: Text) {
  return new TextPartImpl(
    index,
    ({ value }) => {
      if (value) {
        text.nodeValue = convertCharacterEntities(value)
      } else {
        text.nodeValue = null
      }
    },
    text.nodeValue
  )
}

function isNullOrUndefined<T>(value: T | null | undefined): value is null | undefined {
  return value === null || value === undefined
}

function diffStrings(
  previous: ReadonlyArray<string> | null | undefined,
  current: ReadonlyArray<string> | null | undefined
): { added: ReadonlyArray<string>; removed: ReadonlyArray<string>; unchanged: ReadonlyArray<string> } {
  if (previous == null || previous.length === 0) {
    return {
      added: current || [],
      removed: [],
      unchanged: []
    }
  } else if (current == null || current.length === 0) {
    return {
      added: [],
      removed: previous,
      unchanged: []
    }
  } else {
    const added = current.filter((c) => !previous.includes(c))
    const removed: Array<string> = []
    const unchanged: Array<string> = []

    for (let i = 0; i < previous.length; ++i) {
      if (current.includes(previous[i])) {
        unchanged.push(previous[i])
      } else {
        removed.push(previous[i])
      }
    }

    return {
      added,
      removed,
      unchanged
    }
  }
}

function diffDataSet(
  a: Record<string, string | undefined> | null | undefined,
  b: Record<string, string | undefined> | null | undefined
):
  | { added: Array<readonly [string, string | undefined]>; removed: ReadonlyArray<string> }
  | null
{
  if (!a) return b ? { added: Object.entries(b), removed: [] } : null
  if (!b) return { added: [], removed: Object.keys(a) }

  const { added, removed, unchanged } = diffStrings(Object.keys(a), Object.keys(b))

  return {
    added: added.concat(unchanged).map((k) => [k, b[k]] as const),
    removed
  }
}

export function makeSparsePartHandler<A extends PartNode, B extends SyncPart, C, D, X, Z, ZE, ZR>(
  parts: ReadonlyArray<A | TextNode>,
  makePart: (index: number, setValue: (value: C) => void) => B,
  handleText: (text: string) => D,
  join: (values: ReadonlyArray<C | D>) => X,
  setValue: (value: X) => Effect.Effect<Z, ZE, ZR>
): Fx.Fx<Z, ZE, ZR | Scope.Scope> {
  return Fx.mapEffect(
    Fx.withEmitter<X>((sink) =>
      Effect.zipRight(
        Effect.sync(() => {
          const values = new Map<number, C | D>()
          const expected = parts.length

          const setValueIfReady = () => {
            if (values.size === expected) {
              return sink.succeed(join(Array.from(values.values())))
            }
          }

          for (let i = 0; i < parts.length; ++i) {
            const index = i
            const part = parts[i]
            if (part._tag === "text") {
              values.set(i, handleText(part.value))
            } else {
              makePart(part.index, (value) => {
                values.set(index, value)
                setValueIfReady()
              })
            }
          }
        }),
        Effect.never
      )
    ),
    setValue
  )
}

export function handleSparseAttribute<R>(
  element: HTMLElement | SVGElement,
  attr: Attr,
  parts: ReadonlyArray<AttrPartNode | TextNode>,
  schedule: (f: () => void) => Effect.Effect<void, never, R>
): Effect.Effect<void, never, Scope.Scope | R> {
  const set = makeAttributeValueSetter(element, attr)
  return Fx.drain(makeSparsePartHandler(
    parts,
    (index, setValue: (value: string | null | undefined) => void) =>
      new AttributePartImpl(attr.name, index, ({ value }) => setValue(value), attr.value),
    (text) => text,
    (values): string => values.flatMap((v) => isNullOrUndefined(v) ? [] : [v]).join(""),
    (value) => schedule(() => set(value))
  ))
}

export function handleSparseClassName<R>(
  element: HTMLElement | SVGElement,
  parts: ReadonlyArray<ClassNamePartNode | TextNode>,
  schedule: (f: () => void) => Effect.Effect<void, never, R>
): Effect.Effect<void, never, Scope.Scope | R> {
  let previous = Array.from(element.classList)

  return Fx.drain(makeSparsePartHandler(
    parts,
    (index, setValue: (value: ReadonlyArray<string>) => void) =>
      new ClassNamePartImpl(index, ({ value }) => setValue(value), previous),
    splitClassNames,
    (values) => values.flat(1),
    (values) =>
      schedule(() => {
        const { added, removed } = diffStrings(previous, values)
        element.classList.add(...added)
        element.classList.remove(...removed)
        previous = values
      })
  ))
}

export function handleSparseComment<R>(
  comment: Comment,
  parts: ReadonlyArray<CommentPartNode | TextNode>,
  schedule: (f: () => void) => Effect.Effect<void, never, R>
): Effect.Effect<void, never, Scope.Scope | R> {
  return Fx.drain(makeSparsePartHandler(
    parts,
    (index, setValue: (value: string | null | undefined) => void) =>
      new CommentPartImpl(index, ({ value }) => setValue(value), comment.textContent),
    identity,
    (values): string => values.flatMap((v) => isNullOrUndefined(v) ? [] : [v]).join(""),
    (value) => schedule(() => (comment.textContent = value))
  ))
}

export function makeNodePart(
  index: number,
  comment: Comment,
  document: Document,
  isHydrating: boolean
) {
  let text: Text
  let nodes = isHydrating ? findPreviousNodes(comment, index) : []

  return new NodePartImpl(
    index,
    ({ value }) => {
      matchNodeValue(
        value,
        (content) => {
          if (text === undefined) {
            text = document.createTextNode("")
          }
          text.textContent = convertCharacterEntities(content)

          nodes = diffChildren(comment, nodes, [text], document)
        },
        (updatedNodes) => {
          nodes = diffChildren(comment, nodes, updatedNodes, document)
        }
      )
    },
    nodes
  )
}

export function getPreviousTextSibling(node: Node | null) {
  if (!node) return null

  if (node && node.nodeType === node.TEXT_NODE) {
    // During hydration there should be a comment to separate these values
    if (
      node.previousSibling &&
      isComment(node.previousSibling) &&
      isCommentWithValue(node.previousSibling, "text")
    ) {
      return node as Text
    }
  }

  return null
}

function findPreviousNodes(comment: Comment, index: number) {
  const previousIndex = `hole${index - 1}`

  const nodes: Array<Node> = []

  let node = comment.previousSibling
  while (node && !isCommentWithValue(node, previousIndex) && !isCommentWithValue(node, "text")) {
    nodes.unshift(node)
    node = node.previousSibling
  }

  return nodes
}

function diffChildren(
  comment: Comment,
  currentNodes: Array<Node>,
  nextNodes: Array<Node>,
  document: Document
) {
  return udomdiff(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    comment.parentNode!,
    // Document Fragments cannot be removed, so we filter them out
    currentNodes.filter((x) => x.nodeType !== x.DOCUMENT_FRAGMENT_NODE),
    nextNodes,
    diffable(document),
    comment
  )
}

function matchNodeValue<A, B>(value: unknown, onText: (text: string) => A, onNodes: (nodes: Array<Node>) => B): A | B {
  switch (typeof value) {
    // primitives are handled as text content
    case "string":
    case "symbol":
    case "number":
    case "bigint":
    case "boolean":
      return onText(String(value))
    case "undefined":
    case "object": {
      if (!value) {
        return onNodes([])
      } else if (Array.isArray(value)) {
        // arrays can be used to cleanup, if empty
        if (value.length === 0) return onNodes([])
        // or diffed, if these contains nodes or "wires"
        else if (value.some((x) => typeof x === "object")) {
          return onNodes(value.flatMap(renderEventToArray))
        } // in all other cases the content is stringified as is
        else return onText(String(value))
      } else {
        return onNodes(renderEventToArray(value))
      }
    }
    case "function":
      return onNodes([])
  }
}

function renderEventToArray(x: unknown): Array<Node> {
  if (x === null || x === undefined) return []
  if (isRenderEvent(x)) {
    const value = x.valueOf()
    return Array.isArray(value) ? value : [value]
  }

  return [x as Node]
}

export function makeCommentPart(index: number, comment: Comment) {
  return new CommentPartImpl(index, ({ value }) => (comment.nodeValue = value ?? null), comment.textContent)
}

// TODO: RenderQueue should be ammended to allow Ref's to only emit once they're inserted into the DOM
// TODO: Handle spread attributes/properties
// TODO: Helpers for attaching different data structures to parts
// TODO: Helpers for directives
// TODO: Hydration need to support nested fragments of elements
// TODO: Need to be able to configure replacement parts
