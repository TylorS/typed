import type { Context } from "@typed/context"
import * as Fx from "@typed/fx/Fx"
import { WithContext } from "@typed/fx/Sink"
import type { ElementRef } from "@typed/template/ElementRef"
import type { ElementSource } from "@typed/template/ElementSource"
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
import type { Rendered } from "@typed/wire"
import type { Cause } from "effect/Cause"
import * as Effect from "effect/Effect"
import { equals } from "effect/Equal"
import { strict } from "effect/Equivalence"
import type { Equivalence } from "effect/Equivalence"
import * as Fiber from "effect/Fiber"
import * as ReadonlyArray from "effect/ReadonlyArray"
import type { Scope } from "effect/Scope"
import * as SynchronizedRef from "effect/SynchronizedRef"

const strictEq = strict<any>()

const base = <T extends Part["_tag"]>(tag: T) =>
  class Base {
    readonly _tag: T = tag

    constructor(
      readonly index: number,
      readonly commit: (
        params: {
          previous: Extract<Part, { readonly _tag: T }>["value"]
          value: Extract<Part, { readonly _tag: T }>["value"]
          part: Extract<Part, { readonly _tag: T }>
        }
      ) => Effect.Effect<Scope, never, void>,
      public value: Extract<Part, { readonly _tag: T }>["value"],
      readonly eq: Equivalence<Extract<Part, { readonly _tag: T }>["value"]> = equals
    ) {
      this.update = this.update.bind(this)
    }

    update(input: this["value"]) {
      const previous = this.value as any
      const value = this.getValue(input) as any

      if (this.eq(previous as any, value as any)) {
        return Effect.unit
      }

      return Effect.tap(
        this.commit.call(this, {
          previous,
          value,
          part: this as any
        }),
        () => Effect.sync(() => this.value = value)
      )
    }

    getValue(value: unknown) {
      return value
    }
  }

export class AttributePartImpl extends base("attribute") implements AttributePart {
  constructor(
    readonly name: string,
    index: number,
    commit: AttributePartImpl["commit"],
    value: AttributePart["value"]
  ) {
    super(index, commit, value, strictEq)
  }

  static browser(index: number, element: Element, name: string, context: RenderContext): AttributePartImpl {
    return new AttributePartImpl(
      name,
      index,
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

  static browser(index: number, element: Element, name: string, context: RenderContext): BooleanPartImpl {
    return new BooleanPartImpl(
      name,
      index,
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

  static browser(index: number, element: Element, context: RenderContext): ClassNamePartImpl {
    return new ClassNamePartImpl(
      index,
      ({ part, previous, value }) =>
        context.queue.add(
          part,
          () => {
            const { added, removed } = diffStrings(
              previous,
              value
            )

            element.classList.add(...added)
            element.classList.remove(...removed)
          }
        ),
      null
    )
  }

  static server(
    index: number,
    commit: ClassNamePartImpl["commit"]
  ) {
    return new ClassNamePartImpl(index, commit, null)
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
  static browser(index: number, comment: globalThis.Comment, ctx: RenderContext) {
    return new CommentPartImpl(
      index,
      ({ part, value }) => ctx.queue.add(part, () => comment.data = value || ""),
      comment.data,
      strictEq
    )
  }

  static server(index: number, commit: CommentPartImpl["commit"]) {
    return new CommentPartImpl(index, commit, null)
  }
}

export class DataPartImpl extends base("data") implements DataPart {
  static browser(index: number, element: HTMLElement | SVGElement, ctx: RenderContext) {
    return new DataPartImpl(
      index,
      ({ part, previous, value }) =>
        ctx.queue.add(
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

export class EventPartImpl extends base("event") implements EventPart {
  constructor(
    readonly name: string,
    readonly onCause: <E>(cause: Cause<E>) => Effect.Effect<never, never, unknown>,
    index: number,
    commit: EventPartImpl["commit"],
    value: EventPart["value"]
  ) {
    super(index, commit, value, strictEq)
  }

  static browser<T extends Rendered, E>(
    name: string,
    index: number,
    ref: ElementRef<T>,
    element: HTMLElement | SVGElement,
    onCause: (cause: Cause<E>) => Effect.Effect<never, never, unknown>
  ): Effect.Effect<unknown, never, void> {
    return withSwitchFork((fork, ctx) => {
      const source = ref.query(element)

      return Effect.succeed(
        new EventPartImpl(
          name,
          onCause as any,
          index,
          ({ value }) => {
            return value
              ? Fx.run(
                source.events(name as keyof HTMLElementEventMap | keyof SVGElementEventMap, value.options),
                WithContext(onCause, value.handler)
              ).pipe(
                Effect.provide(ctx),
                fork
              )
              : fork(Effect.unit)
          },
          null
        )
      )
    })
  }
}

function withScopedFork<R, E, A>(f: (fork: Fx.ScopedFork) => Effect.Effect<R, E, A>): Effect.Effect<R | Scope, E, A> {
  return Effect.scopeWith((scope) => f(Effect.forkIn(scope)))
}

// Ensures only a single fiber is executing
function withSwitchFork<R, E, A>(
  f: (fork: Fx.FxFork, ctx: Context<R | Scope>) => Effect.Effect<R, E, A>
): Effect.Effect<R | Scope, E, A> {
  return Effect.contextWithEffect((ctx) =>
    withScopedFork((fork) =>
      Effect.flatMap(
        SynchronizedRef.make<Fiber.Fiber<never, void>>(Fiber.unit),
        (ref) =>
          f((effect) =>
            SynchronizedRef.updateAndGetEffect(
              ref,
              (fiber) => Effect.flatMap(Fiber.interrupt(fiber), () => fork(effect))
            ), ctx)
      )
    )
  )
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

  static browser(index: number, node: Node, name: string, ctx: RenderContext) {
    return new PropertyPartImpl(
      name,
      index,
      ({ part, value }) => ctx.queue.add(part, () => (node as any)[name] = value),
      null
    )
  }
}

export class RefPartImpl implements RefPart {
  readonly _tag = "ref"

  constructor(readonly value: ElementSource<any>, readonly index: number) {}
}

export class TextPartImpl extends base("text") implements TextPart {
  // TODO: Make this properly
  static browser(index: number, element: Element, ctx: RenderContext) {
    return new TextPartImpl(
      index,
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
    ctx: RenderContext
  ) {
    return new SparseAttributePartImpl(
      name,
      parts,
      ({ part, value }) =>
        ctx.queue.add(part, () => element.setAttribute(name, value.flatMap((s) => isNonEmptyString(s, true)).join("")))
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
    ctx: RenderContext,
    values: Array<string | Array<string>> = []
  ) {
    return new SparseClassNamePartImpl(
      parts,
      ({ part, value }) =>
        ctx.queue.add(part, () => {
          return element.setAttribute("class", value.flatMap((s) => isNonEmptyString(s, true)).join(" "))
        }),
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

  static browser(comment: Comment, parts: ReadonlyArray<CommentPart | StaticText>, ctx: RenderContext) {
    return new SparseCommentPartImpl(
      parts,
      ({ part, value }) =>
        ctx.queue.add(part, () => comment.nodeValue = value.flatMap((s) => isNonEmptyString(s, false)).join("")),
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
