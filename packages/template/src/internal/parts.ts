import { isText } from "@typed/wire"
import type { Cause } from "effect/Cause"
import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import { equals } from "effect/Equal"
import * as Equivalence from "effect/Equivalence"
import * as ReadonlyArray from "effect/ReadonlyArray"
import type { Scope } from "effect/Scope"
import type { ElementSource } from "../ElementSource.js"
import type { EventHandler } from "../EventHandler.js"
import { unescape } from "../HtmlChunk.js"
import type {
  AttributePart,
  BooleanPart,
  ClassNamePart,
  CommentPart,
  DataPart,
  EventPart,
  NodePart,
  Part,
  PropertiesPart,
  PropertyPart,
  RefPart,
  SparseAttributePart,
  SparseClassNamePart,
  SparseCommentPart,
  SparsePart,
  StaticText,
  TextPart
} from "../Part.js"
import type { RenderQueue } from "../RenderQueue.js"
import { findHoleComment } from "./utils.js"

const strictEq = Equivalence.strict<any>()

const base = <T extends Part["_tag"]>(tag: T) => (class Base {
  readonly _tag: T = tag

  constructor(
    readonly index: number,
    readonly commit: (
      params: {
        previous: Extract<Part, { readonly _tag: T }>["value"]
        value: Extract<Part, { readonly _tag: T }>["value"]
        part: Extract<Part, { readonly _tag: T }>
      },
      priority?: number
    ) => Effect.Effect<void, never, Scope>,
    public value: Extract<Part, { readonly _tag: T }>["value"],
    readonly eq: Equivalence.Equivalence<Extract<Part, { readonly _tag: T }>["value"]> = equals
  ) {
    this.update = this.update.bind(this)
  }

  update(input: this["value"], priority?: number) {
    const previous = this.value as any
    const value = this.getValue(input) as any

    if (this.eq(previous as any, value as any)) {
      return Effect.unit
    }

    return Effect.flatMap(
      this.commit.call(this, {
        previous,
        value,
        part: this as any
      }, priority),
      () => Effect.sync(() => this.value = value)
    )
  }

  getValue(value: unknown) {
    return value
  }
})

export class AttributePartImpl extends base("attribute") implements AttributePart {
  constructor(
    readonly name: string,
    index: number,
    commit: AttributePartImpl["commit"],
    value: AttributePart["value"]
  ) {
    super(index, commit, value, strictEq)
  }

  static browser(index: number, element: Element, name: string, queue: RenderQueue): AttributePartImpl {
    return new AttributePartImpl(
      name,
      index,
      ({ part, value }, priority) =>
        queue.add(
          part,
          () => value == null ? element.removeAttribute(name) : element.setAttribute(name, value),
          priority
        ),
      element.getAttribute(name)
    )
  }

  static server(
    name: string,
    index: number,
    commit: AttributePartImpl["commit"]
  ) {
    return new AttributePartImpl(name, index, commit, null)
  }
}

export class BooleanPartImpl extends base("boolean") implements BooleanPart {
  constructor(
    readonly name: string,
    index: number,
    commit: BooleanPartImpl["commit"],
    value: BooleanPart["value"]
  ) {
    super(index, commit, value, strictEq)
  }

  static browser(index: number, element: Element, name: string, queue: RenderQueue): BooleanPartImpl {
    return new BooleanPartImpl(
      name,
      index,
      ({ part, value }, priority) =>
        queue.add(
          part,
          () => element.toggleAttribute(name, value === true),
          priority
        ),
      element.hasAttribute(name)
    )
  }

  static server(
    name: string,
    index: number,
    commit: BooleanPartImpl["commit"]
  ) {
    return new BooleanPartImpl(name, index, commit, null)
  }
}

const isString = (x: unknown): x is string => typeof x === "string"

export class ClassNamePartImpl extends base("className") implements ClassNamePart {
  constructor(
    index: number,
    commit: ClassNamePartImpl["commit"],
    value: ClassNamePart["value"]
  ) {
    super(index, commit, value, strictEq)
  }

  getValue(value: unknown): ReadonlyArray<string> {
    if (isString(value)) {
      return value.split(" ").filter((x) => isString(x) && x.trim() !== "")
    }

    if (Array.isArray(value)) {
      return value.filter((x) => isString(x) && x.trim() !== "")
    }

    return []
  }

  static browser(index: number, element: Element, queue: RenderQueue): ClassNamePartImpl {
    return new ClassNamePartImpl(
      index,
      ({ part, previous, value }, priority) =>
        queue.add(
          part,
          () => {
            const { added, removed } = diffStrings(
              previous,
              value
            )

            element.classList.add(...added)
            element.classList.remove(...removed)
          },
          priority
        ),
      Array.from(element.classList)
    )
  }

  static server(
    index: number,
    commit: ClassNamePartImpl["commit"]
  ) {
    return new ClassNamePartImpl(index, commit, [])
  }
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

export class CommentPartImpl extends base("comment") implements CommentPart {
  static browser(index: number, comment: globalThis.Comment, queue: RenderQueue) {
    return new CommentPartImpl(
      index,
      ({ part, value }) => queue.add(part, () => comment.data = value || ""),
      comment.data,
      strictEq
    )
  }

  static server(index: number, commit: CommentPartImpl["commit"]) {
    return new CommentPartImpl(index, commit, null)
  }
}

export class DataPartImpl extends base("data") implements DataPart {
  static browser(index: number, element: HTMLElement | SVGElement, queue: RenderQueue) {
    return new DataPartImpl(
      index,
      ({ part, previous, value }) =>
        queue.add(
          part,
          () => {
            const diff = diffDataSet(previous, value)

            if (diff) {
              const { added, removed } = diff

              removed.forEach((k) => delete element.dataset[k])
              added.forEach(([k, v]) => element.dataset[k] = v)
            }
          }
        ),
      element.dataset
    )
  }

  static server(index: number, commit: DataPartImpl["commit"]) {
    return new DataPartImpl(index, commit, null)
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

export class EventPartImpl implements EventPart {
  readonly _tag = "event"
  readonly value: EventPart["value"] = null

  constructor(
    readonly name: string,
    readonly index: number,
    readonly source: ElementSource<any>,
    readonly onCause: <E>(cause: Cause<E>) => Effect.Effect<unknown>,
    readonly addEventListener: <Ev extends Event>(handler: EventHandler<Ev>) => void
  ) {
  }
}

export class NodePartImpl extends base("node") implements NodePart {}

export class PropertyPartImpl extends base("property") implements PropertyPart {
  constructor(
    readonly name: string,
    index: number,
    commit: PropertyPartImpl["commit"],
    value: PropertyPartImpl["value"]
  ) {
    super(index, commit, value, strictEq)
  }

  static browser(index: number, node: Node, name: string, queue: RenderQueue) {
    const existing = (node as Element).getAttribute(name)

    return new PropertyPartImpl(
      name,
      index,
      ({ part, value }) => queue.add(part, () => (node as any)[name] = value),
      existing ? unescape(existing) : null
    )
  }
}

export class RefPartImpl implements RefPart {
  readonly _tag = "ref"

  constructor(readonly value: ElementSource<any>, readonly index: number) {}
}

export class TextPartImpl extends base("text") implements TextPart {
  static browser(document: Document, index: number, element: Element, queue: RenderQueue) {
    const comment = findHoleComment(element, index)
    const text = document.createTextNode("")
    element.insertBefore(text, comment)

    return new TextPartImpl(
      index,
      ({ part, value }, priority) => queue.add(part, () => text.nodeValue = value ?? null, priority),
      text.nodeValue,
      strictEq
    )
  }

  static fromText(text: Text, index: number, queue: RenderQueue) {
    return new TextPartImpl(
      index,
      ({ part, value }, priority) => queue.add(part, () => text.nodeValue = value ?? null, priority),
      text.nodeValue,
      strictEq
    )
  }

  static getOrCreateText(document: Document, index: number, element: Element) {
    const comment = findHoleComment(element, index)

    return comment.previousSibling && isText(comment.previousSibling)
      ? comment.previousSibling.nodeValue
      : document.createTextNode("")
  }
}

export class PropertiesPartImpl extends base("properties") implements PropertiesPart {
  constructor(
    index: number,
    commit: PropertiesPartImpl["commit"],
    value: PropertiesPartImpl["value"]
  ) {
    super(index, commit, value, equals)
  }

  getValue(value: unknown): unknown {
    if (value == null) return null
    return Data.struct(value)
  }

  static browser(index: number, element: HTMLElement | SVGElement, queue: RenderQueue) {
    return new PropertiesPartImpl(
      index,
      ({ part, previous, value }, priority) =>
        queue.add(
          part,
          () => {
            const diff = diffProperties(previous, value)
            if (diff) {
              const { added, removed } = diff

              removed.forEach((nv) => removeNameValue(element, nv))
              added.forEach((nv) => {
                if ((nv.name[0] === "o" && nv.name[1] === "n") || nv.name[0] === "@") return

                return addNameValue(element, nv)
              })
            }
          },
          priority
        ),
      {}
    )
  }
}

function removeNameValue(element: HTMLElement | SVGElement, { name, type }: NameValue) {
  switch (type) {
    case "attr":
    case "bool":
      return element.removeAttribute(name)
    case "prop":
      return delete (element as any)[name]
  }
}

function addNameValue(element: HTMLElement | SVGElement, { name, type, value }: NameValue) {
  switch (type) {
    case "attr":
      return value == null ? element.removeAttribute(name) : element.setAttribute(name, value)
    case "bool":
      return value == null ? element.removeAttribute(name) : element.toggleAttribute(name, value)
    case "prop":
      return value == null ? (delete (element as any)[name]) : (element as any)[name] = value
  }
}

type AttrNameValue = {
  readonly type: "attr"
  readonly name: string
  readonly value: string
}

type BoolAttrNameValue = {
  readonly type: "bool"
  readonly name: string
  readonly value: boolean
}

type PropNameValue = {
  readonly type: "prop"
  readonly name: string
  readonly value: unknown
}

type NameValue = AttrNameValue | BoolAttrNameValue | PropNameValue

function diffProperties(
  a: Record<string, unknown> | null | undefined,
  b: Record<string, unknown> | null | undefined
): { added: Array<NameValue>; removed: ReadonlyArray<NameValue> } | null {
  if (!a) {
    if (b) {
      return { added: Object.entries(b).flatMap(([k, v]) => fromKeyValue(k, v)), removed: [] }
    } else return null
  } else if (!b) {
    return { added: [], removed: Object.entries(a).flatMap(([k, v]) => fromKeyValue(k, v)) }
  } else {
    const { added, removed, unchanged } = diffStrings(Object.keys(a), Object.keys(b))

    return {
      added: added.concat(unchanged).flatMap((k) => fromKeyValue(k, b[k])),
      removed: removed.flatMap((k) => fromKeyValue(k, a[k]))
    }
  }
}

function fromKeyValue(name: string, value: unknown): Array<NameValue> {
  if (name[0] === ".") {
    return value == null ? [] : [{
      type: "prop",
      name: name.slice(1),
      value
    }]
  } else if (typeof value === "boolean") {
    return [{
      type: "bool",
      name,
      value
    }]
  } else {
    if (name[0] === "o" || name[1] === "n") return []

    return value == null ? [] : [{
      type: "attr",
      name,
      value: String(value)
    }]
  }
}

const sparse = <T extends SparsePart["_tag"]>(tag: T) => (class Base {
  readonly _tag: T = tag

  constructor(
    readonly commit: (
      params: {
        previous: SparseAttributeValues<Extract<SparsePart, { readonly _tag: T }>["parts"]>
        value: SparseAttributeValues<Extract<SparsePart, { readonly _tag: T }>["parts"]>
        part: Extract<SparsePart, { readonly _tag: T }>
      },
      priority?: number
    ) => Effect.Effect<void, never, Scope>,
    public value: SparseAttributeValues<Extract<SparsePart, { readonly _tag: T }>["parts"]>,
    readonly eq: Equivalence.Equivalence<SparseAttributeValues<Extract<SparsePart, { readonly _tag: T }>["parts"]>> =
      equals
  ) {}

  update = (value: this["value"], priority?: number) => {
    if (this.eq(this.value as any, value as any)) {
      return Effect.unit
    }

    return this.commit({
      previous: this.value,
      value: this.value = value as any,
      part: this
    } as any, priority)
  }
})

type SparseAttributeValues<T extends ReadonlyArray<AttributePart | ClassNamePart | CommentPart | StaticText>> =
  ReadonlyArray<
    SparseAttributeValue<T[number]>
  >
type SparseAttributeValue<T extends AttributePart | ClassNamePart | CommentPart | StaticText> = T["value"]

export class SparseAttributePartImpl extends sparse("sparse/attribute") implements SparseAttributePart {
  constructor(
    readonly name: string,
    readonly parts: ReadonlyArray<AttributePart | StaticText>,
    commit: SparseAttributePartImpl["commit"]
  ) {
    super(commit, [], ReadonlyArray.getEquivalence(strictEq))
  }

  static browser(
    name: string,
    parts: ReadonlyArray<AttributePart | StaticText>,
    element: HTMLElement | SVGElement,
    queue: RenderQueue
  ) {
    return new SparseAttributePartImpl(
      name,
      parts,
      ({ part, value }, priority) =>
        queue.add(
          part,
          () => element.setAttribute(name, value.flatMap((s) => isNonEmptyString(s, true)).join("")),
          priority
        )
    )
  }
}

export class SparseClassNamePartImpl extends sparse("sparse/className") implements SparseClassNamePart {
  constructor(
    readonly parts: ReadonlyArray<ClassNamePart | StaticText>,
    commit: SparseClassNamePartImpl["commit"],
    values: Array<string | Array<string>>
  ) {
    super(commit, values, ReadonlyArray.getEquivalence(strictEq))
  }

  static browser(
    parts: ReadonlyArray<ClassNamePart | StaticText>,
    element: HTMLElement | SVGElement,
    queue: RenderQueue,
    values: Array<string | Array<string>> = []
  ) {
    return new SparseClassNamePartImpl(
      parts,
      ({ part, value }, priority) =>
        queue.add(
          part,
          () => element.setAttribute("class", value.flatMap((s) => isNonEmptyString(s, true)).join(" ")),
          priority
        ),
      values
    )
  }
}

export class SparseCommentPartImpl extends sparse("sparse/comment") implements SparseCommentPart {
  constructor(
    readonly parts: ReadonlyArray<CommentPart | StaticText>,
    commit: SparseCommentPartImpl["commit"],
    value: SparseCommentPartImpl["value"]
  ) {
    super(commit, value, ReadonlyArray.getEquivalence(strictEq))
  }

  static browser(comment: Comment, parts: ReadonlyArray<CommentPart | StaticText>, queue: RenderQueue) {
    return new SparseCommentPartImpl(
      parts,
      ({ part, value }, priority) =>
        queue.add(part, () => comment.nodeValue = value.flatMap((s) => isNonEmptyString(s, false)).join(""), priority),
      []
    )
  }
}

export class StaticTextImpl implements StaticText {
  readonly _tag = "static/text"

  constructor(readonly value: string) {}
}

function isNonEmptyString(s: string | ReadonlyArray<string> | null | undefined, trim: boolean): Array<string> {
  if (s == null) return []
  if (Array.isArray(s)) return s.flatMap((s) => isNonEmptyString(s, trim))

  const trimmed = trim ? (s as string).trim() : s

  if (trimmed.length === 0) return []

  return [trimmed as string]
}
