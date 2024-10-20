import * as Fx from "@typed/fx"
import * as Effect from "effect/Effect"
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
import type { Directive } from "../../Directive.js"
import { isDirective } from "../../Directive.js"
import type { Renderable } from "../../Renderable.js"
import { isRenderEvent } from "../../RenderEvent.js"
import { isCommentWithValue } from "../utils.js"
import { syncPartToPart } from "./parts.js"

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
  renderables: ReadonlyArray<Renderable<any, any>>,
  makePart: (index: number, setValue: (value: C) => void) => B,
  handleText: (text: string) => D,
  join: (values: ReadonlyArray<C | D>) => X,
  setValue: (value: X) => Effect.Effect<Z, ZE, ZR>
): Fx.Fx<Z, any, any> {
  return Fx.mapEffect(
    Fx.withEmitter<X, any, any, any>((sink) =>
      Effect.zipRight(
        Effect.gen(function*() {
          const values = new Map<number, C | D>()
          const expected = parts.length

          const setValueIfReady = () => {
            if (values.size === expected) {
              return sink.succeed(join(Array.from({ length: expected }, (_, i) => values.get(i)!)))
            }
          }

          for (let i = 0; i < parts.length; ++i) {
            const index = i
            const part = parts[i]
            if (part._tag === "text") {
              values.set(i, handleText(part.value))
            } else {
              const child = makePart(part.index, (value) => {
                values.set(index, value)
                setValueIfReady()
              })
              const value = renderables[part.index]

              yield* Effect.forkScoped(matchRenderable(value, {
                Fx: (fx) =>
                  fx.run(Fx.Sink.make((cause) =>
                    Effect.promise(() => sink.failCause(cause)), (value) =>
                    Effect.sync(() => child.update(value as never)))),
                Effect: (effect) =>
                  Effect.tap(effect, (value) => child.update(value as never)),
                Directive: (directive) =>
                  directive(syncPartToPart(child, ({ value }) => Effect.sync(() => child.update(value as never)))),
                Otherwise: (value) => Effect.sync(() => child.update(value as never))
              }))
            }
          }

          setValueIfReady()
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
  values: ReadonlyArray<Renderable<any, any>>,
  schedule: (f: () => void) => Effect.Effect<void, never, R>
): Effect.Effect<void, any, any> {
  const set = makeAttributeValueSetter(element, attr)
  return Fx.drain(makeSparsePartHandler(
    parts,
    values,
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
  values: ReadonlyArray<Renderable<any, any>>,
  schedule: (f: () => void) => Effect.Effect<void, never, R>
): Effect.Effect<void, any, any> {
  let previous = Array.from(element.classList)

  return Fx.drain(makeSparsePartHandler(
    parts,
    values,
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
  values: ReadonlyArray<Renderable<any, any>>,
  schedule: (f: () => void) => Effect.Effect<void, never, R>
): Effect.Effect<void, any, any> {
  return Fx.drain(makeSparsePartHandler(
    parts,
    values,
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
  text: Text | null,
  nodes: Array<Node>
) {
  return new NodePartImpl(
    index,
    ({ value }) => {
      matchNodeValue(
        value,
        (content) => {
          if (text === null) {
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
      isCommentWithValue(node.previousSibling, "text")
    ) {
      return node as Text
    }
  }

  return null
}

export function findPreviousNodes(comment: Comment, index: number, hash: string) {
  const previousComments = new Set([`hole${index - 1}`, `typed-${hash}`])

  const nodes: Array<Node> = []

  let node = comment.previousSibling
  while (node) {
    if (isComment(node) && previousComments.has(node.data)) {
      break
    }

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
    comment.parentNode!,
    currentNodes,
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

function matchRenderable<A, B, C, D>(
  renderable: Renderable<any, any>,
  matches: {
    Fx: (fx: Fx.Fx<any, any, any>) => A
    Effect: (effect: Effect.Effect<any, any, any>) => B
    Directive: (directive: Directive<any, any>) => C
    Otherwise: (_: any) => D
  }
): A | B | C | D {
  if (Fx.isFx(renderable)) {
    return matches.Fx(renderable)
  } else if (Effect.isEffect(renderable)) {
    return matches.Effect(renderable)
  } else if (isDirective<any, any>(renderable)) {
    return matches.Directive(renderable)
  } else {
    return matches.Otherwise(renderable)
  }
}
