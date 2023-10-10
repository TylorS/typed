import type {
  AttributePart,
  BooleanPart,
  ClassNamePart,
  CommentPart,
  DataPart,
  EventPart,
  NodePart,
  Part,
  PropertyPart,
  RefPart,
  SparseAttributePart,
  SparseClassNamePart,
  SparseCommentPart,
  SparsePart,
  StaticText,
  TextPart
} from "@typed/template/Part"
import type { RenderContext } from "@typed/template/RenderContext"
import type { Cause } from "effect/Cause"
import * as Effect from "effect/Effect"
import { equals } from "effect/Equal"
import { strict } from "effect/Equivalence"
import type { Equivalence } from "effect/Equivalence"
import * as ReadonlyArray from "effect/ReadonlyArray"
import type { Scope } from "effect/Scope"

const strictEq = strict<any>()

const base = <T extends Part["_tag"]>(tag: T) =>
  class Base {
    readonly _tag: T = tag

    constructor(
      readonly context: RenderContext,
      readonly commit: (
        params: {
          previous: Extract<Part, { readonly _tag: T }>["value"]
          value: Extract<Part, { readonly _tag: T }>["value"]
          part: Extract<Part, { readonly _tag: T }>
        }
      ) => Effect.Effect<Scope, never, void>,
      public value: Extract<Part, { readonly _tag: T }>["value"],
      readonly eq: Equivalence<Extract<Part, { readonly _tag: T }>["value"]> = equals
    ) {}

    update = (value: this["value"]) => {
      if (this.eq(this.value as any, value as any)) {
        return Effect.unit
      }

      return this.commit({
        previous: this.value,
        value: this.value = value as any,
        part: this
      } as any)
    }
  }

export class AttributePartImpl extends base("attribute") implements AttributePart {
  constructor(
    readonly name: string,
    context: RenderContext,
    commit: AttributePartImpl["commit"],
    value: AttributePart["value"]
  ) {
    super(context, commit, value, strictEq)
  }

  static browser(element: Element, name: string, context: RenderContext): AttributePartImpl {
    return new AttributePartImpl(
      name,
      context,
      ({ part, value }) =>
        context.queue.add(
          part,
          () => value == null ? element.removeAttribute(name) : element.setAttribute(name, value)
        ),
      element.getAttribute(name)
    )
  }

  static server(
    name: string,
    context: RenderContext,
    commit: AttributePartImpl["commit"]
  ) {
    return new AttributePartImpl(name, context, commit, null)
  }
}

export class BooleanPartImpl extends base("boolean") implements BooleanPart {
  constructor(
    readonly name: string,
    context: RenderContext,
    commit: BooleanPartImpl["commit"],
    value: BooleanPart["value"]
  ) {
    super(context, commit, value, strictEq)
  }

  static browser(element: Element, name: string, context: RenderContext): BooleanPartImpl {
    return new BooleanPartImpl(
      name,
      context,
      ({ part, value }) =>
        context.queue.add(
          part,
          () => element.toggleAttribute(name, value === true)
        ),
      element.hasAttribute(name)
    )
  }

  static server(
    name: string,
    context: RenderContext,
    commit: BooleanPartImpl["commit"]
  ) {
    return new BooleanPartImpl(name, context, commit, null)
  }
}

export class ClassNamePartImpl extends base("className") implements ClassNamePart {
  constructor(
    context: RenderContext,
    commit: ClassNamePartImpl["commit"],
    value: ClassNamePart["value"]
  ) {
    super(context, commit, value, strictEq)
  }

  static browser(element: Element, context: RenderContext): ClassNamePartImpl {
    return new ClassNamePartImpl(
      context,
      ({ part, previous, value }) =>
        context.queue.add(
          part,
          () => {
            const { added, removed } = diffStrings(previous, value)

            element.classList.add(...added)
            element.classList.remove(...removed)
          }
        ),
      Array.from(element.classList)
    )
  }

  static server(
    context: RenderContext,
    commit: ClassNamePartImpl["commit"]
  ) {
    return new ClassNamePartImpl(context, commit, null)
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
  static browser(comment: globalThis.Comment, ctx: RenderContext) {
    return new CommentPartImpl(
      ctx,
      ({ part, value }) => ctx.queue.add(part, () => comment.data = value || ""),
      comment.data,
      strictEq
    )
  }

  static server(ctx: RenderContext, commit: CommentPartImpl["commit"]) {
    return new CommentPartImpl(ctx, commit, null)
  }
}

export class DataPartImpl extends base("data") implements DataPart {
  static browser(element: HTMLElement | SVGElement, ctx: RenderContext) {
    return new DataPartImpl(
      ctx,
      ({ part, previous, value }) =>
        ctx.queue.add(
          part,
          () => {
            const diff = diffDataSet(previous, value)

            if (diff) {
              const { added, removed } = diff

              removed.forEach(([k]) => delete element.dataset[k])
              added.forEach(([k, v]) => element.dataset[k] = v)
            }
          }
        ),
      element.dataset
    )
  }

  static server(ctx: RenderContext, commit: DataPartImpl["commit"]) {
    return new DataPartImpl(ctx, commit, null)
  }
}

function diffDataSet(
  a: Record<string, string | undefined> | null | undefined,
  b: Record<string, string | undefined> | null | undefined
):
  | { added: Array<readonly [string, string | undefined]>; removed: Array<readonly [string, string | undefined]> }
  | null
{
  if (!a) return b ? { added: Object.entries(b), removed: [] } : null
  if (!b) return a ? { added: [], removed: Object.entries(a) } : null

  const { added, removed, unchanged } = diffStrings(Object.keys(a), Object.keys(b))

  return {
    added: added.concat(unchanged).map((k) => [k, b[k]] as const),
    removed: removed.map((k) => [k, a[k]] as const)
  }
}

export class EventPartImpl extends base("event") implements EventPart {
  constructor(
    readonly name: string,
    readonly onCause: (cause: Cause<unknown>) => Effect.Effect<never, never, unknown>,
    context: RenderContext,
    commit: EventPartImpl["commit"],
    value: EventPart["value"]
  ) {
    super(context, commit, value, strictEq)
  }

  static browser(
    name: string,
    element: HTMLElement | SVGElement,
    onCause: (cause: Cause<unknown>) => Effect.Effect<never, never, unknown>,
    ctx: RenderContext
  ) {
    return new EventPartImpl(
      name,
      onCause,
      ctx,
      // TODO: We need a way to utilize event delegation
      () => Effect.unit,
      null
    )
  }
}

export class NodePartImpl extends base("node") implements NodePart {
  static browser(element: HTMLElement | SVGElement, ctx: RenderContext) {
    return new NodePartImpl(ctx, ({ part }) =>
      ctx.queue.add(part, () => {
        // TODO: We need to port over the diffing of children
      }), [])
  }
}

export class PropertyPartImpl extends base("property") implements PropertyPart {
  constructor(
    readonly name: string,
    context: RenderContext,
    commit: PropertyPartImpl["commit"],
    value: PropertyPartImpl["value"]
  ) {
    super(context, commit, value, strictEq)
  }

  static browser(node: Node, name: string, ctx: RenderContext) {
    // TODO: We need to be able to set the Reference at the right time.
    return new PropertyPartImpl(
      name,
      ctx,
      ({ part, value }) => ctx.queue.add(part, () => (node as any)[name] = value),
      null
    )
  }
}

export class RefPartImpl extends base("ref") implements RefPart {
  static browser(node: Node, ctx: RenderContext) {
    // TODO: We need to be able to set the Reference at the right time.
    return new RefPartImpl(ctx, () => Effect.unit, null, strictEq)
  }
}

export class TextPartImpl extends base("text") implements TextPart {
  // TODO: Make this properly
  static browser(element: Element, ctx: RenderContext) {
    return new TextPartImpl(
      ctx,
      ({ part, value }) => ctx.queue.add(part, () => element.textContent = value || ""),
      element.textContent,
      strictEq
    )
  }
}

const sparse = <T extends SparsePart["_tag"]>(tag: T) =>
  class Base {
    readonly _tag: T = tag

    constructor(
      readonly context: RenderContext,
      readonly commit: (
        params: {
          previous: SparseAttributeValues<Extract<SparsePart, { readonly _tag: T }>["parts"]>
          value: SparseAttributeValues<Extract<SparsePart, { readonly _tag: T }>["parts"]>
          part: Extract<SparsePart, { readonly _tag: T }>
        }
      ) => Effect.Effect<Scope, never, void>,
      public value: SparseAttributeValues<Extract<SparsePart, { readonly _tag: T }>["parts"]>,
      readonly eq: Equivalence<SparseAttributeValues<Extract<SparsePart, { readonly _tag: T }>["parts"]>> = equals
    ) {}

    update = (value: this["value"]) => {
      if (this.eq(this.value as any, value as any)) {
        return Effect.unit
      }

      return this.commit({
        previous: this.value,
        value: this.value = value as any,
        part: this
      } as any)
    }
  }

type SparseAttributeValues<T extends ReadonlyArray<AttributePart | ClassNamePart | CommentPart | StaticText>> =
  ReadonlyArray<
    SparseAttributeValue<T[number]>
  >
type SparseAttributeValue<T extends AttributePart | ClassNamePart | CommentPart | StaticText> = T["value"]

// TODO: Need patterns for managing sparse attributes ported over

export class SparseAttributePartImpl extends sparse("sparse/attribute") implements SparseAttributePart {
  constructor(
    readonly name: string,
    readonly parts: ReadonlyArray<AttributePart | StaticText>,
    ctx: RenderContext,
    commit: SparseAttributePartImpl["commit"]
  ) {
    super(ctx, commit, [], ReadonlyArray.getEquivalence(strictEq))
  }

  static browser(
    name: string,
    parts: ReadonlyArray<AttributePart | StaticText>,
    element: HTMLElement | SVGElement,
    ctx: RenderContext
  ) {
    return new SparseAttributePartImpl(
      name,
      parts,
      ctx,
      ({ part, value }) =>
        ctx.queue.add(part, () => element.setAttribute(name, value.flatMap(isNonEmptyString).join("")))
    )
  }
}

export class SparseClassNamePartImpl extends sparse("sparse/className") implements SparseClassNamePart {
  constructor(
    readonly parts: ReadonlyArray<ClassNamePart | StaticText>,
    ctx: RenderContext,
    commit: SparseClassNamePartImpl["commit"]
  ) {
    super(ctx, commit, [], ReadonlyArray.getEquivalence(strictEq))
  }

  static browser(
    parts: ReadonlyArray<ClassNamePart | StaticText>,
    element: HTMLElement | SVGElement,
    ctx: RenderContext
  ) {
    return new SparseClassNamePartImpl(
      parts,
      ctx,
      ({ part, value }) =>
        ctx.queue.add(part, () => element.setAttribute("class", value.flatMap(isNonEmptyString).join(" ")))
    )
  }
}

export class SparseCommentPartImpl extends sparse("sparse/comment") implements SparseCommentPart {
  constructor(
    readonly parts: ReadonlyArray<CommentPart | StaticText>,
    ctx: RenderContext,
    commit: SparseCommentPartImpl["commit"],
    value: SparseCommentPartImpl["value"]
  ) {
    super(ctx, commit, value, ReadonlyArray.getEquivalence(strictEq))
  }

  static browser(comment: Comment, parts: ReadonlyArray<CommentPart | StaticText>, ctx: RenderContext) {
    return new SparseCommentPartImpl(
      parts,
      ctx,
      ({ part, value }) => ctx.queue.add(part, () => comment.nodeValue = value.flatMap(isNonEmptyString).join("")),
      []
    )
  }
}

export class StaticTextImpl implements StaticText {
  readonly _tag = "static/text"

  constructor(readonly value: string) {}
}

function isNonEmptyString(s: string | ReadonlyArray<string> | null | undefined): Array<string> {
  if (s == null) return []
  if (Array.isArray(s)) return s.flatMap(isNonEmptyString)

  const trimmed = (s as string).trim()

  if (trimmed.length === 0) return []

  return [trimmed]
}
