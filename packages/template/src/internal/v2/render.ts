import * as Fx from "@typed/fx"
import type { Scope } from "effect"
import { Effect } from "effect"
import { identity } from "effect/Function"
import type { ElementSource } from "../../ElementSource.js"
import type { AttrPartNode, ClassNamePartNode, CommentPartNode, PartNode, TextNode } from "../../Template.js"
import { convertCharacterEntities } from "../character-entities.js"
import type { Part } from "./Part.js"
import {
  AttributePartImpl,
  BooleanPartImpl,
  ClassNamePartImpl,
  CommentPartImpl,
  DataPartImpl,
  PropertyPartImpl,
  RefPartImpl,
  splitClassNames,
  TextPartImpl
} from "./parts.js"

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

export function makeRefPart(index: number, ref: ElementSource) {
  return new RefPartImpl(index, identity, ref)
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

export function makeSparsePartHandler<A extends PartNode, B extends Part, C, D, X, Z, ZE, ZR>(
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

// TODO: Node Part
// TODO: RenderQueue should be ammended to allow Ref's to only emit once they're inserted into the DOM
// TODO: Handle spread attributes/properties
// TODO: Helpers for attaching different data structures to parts
// TODO: Helpers for directives
// TODO: RenderQueue should be updated to ensure the highest-priority is used for a given part
// TODO: Hydration need to support nested fragments of elements
// TODO: Need to be able to configure replacement parts
// TODO: The start and end of Templates need to be marked
