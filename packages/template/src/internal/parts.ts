import type { AttributePart, BooleanPart, ClassNamePart, Part } from "@typed/template/Part"
import type { RenderContext } from "@typed/template/RenderContext"
import * as Effect from "effect/Effect"
import { equals } from "effect/Equal"
import { strict } from "effect/Equivalence"
import type { Equivalence } from "effect/Equivalence"
import type { Scope } from "effect/Scope"

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
      readonly eq: Equivalence<Extract<Part, { readonly _tag: T }>["value"]> = equals,
      public value: Extract<Part, { readonly _tag: T }>["value"]
    ) {}

    update = (value: this["value"]) =>
      Effect.suspend(() => {
        if (this.eq(this.value as any, value as any)) {
          return Effect.unit
        }

        return this.commit({
          previous: this.value,
          value: this.value = value as any,
          part: this
        } as any)
      })
  }

export class AttributePartImpl extends base("attribute") implements AttributePart {
  constructor(
    readonly name: string,
    context: RenderContext,
    commit: AttributePartImpl["commit"],
    value: AttributePart["value"]
  ) {
    super(context, commit, strict(), value)
  }

  static browser(element: Element, name: string, context: RenderContext): AttributePartImpl {
    return new AttributePartImpl(
      name,
      context,
      ({ part, value }) =>
        context.queue.add(
          part,
          Effect.sync(() => value == null ? element.removeAttribute(name) : element.setAttribute(name, value))
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
    super(context, commit, strict(), value)
  }

  static browser(element: Element, name: string, context: RenderContext): BooleanPartImpl {
    return new BooleanPartImpl(
      name,
      context,
      ({ part, value }) =>
        context.queue.add(
          part,
          Effect.sync(() => element.toggleAttribute(name, value === true))
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
    readonly name: string,
    context: RenderContext,
    commit: ClassNamePartImpl["commit"],
    value: ClassNamePart["value"]
  ) {
    super(context, commit, strict(), value)
  }

  static browser(element: Element, name: string, context: RenderContext): ClassNamePartImpl {
    return new ClassNamePartImpl(
      name,
      context,
      ({ part, previous, value }) =>
        context.queue.add(
          part,
          Effect.sync(() => {
            const { added, removed } = diffStrings(previous, value)

            element.classList.add(...added)
            element.classList.remove(...removed)
          })
        ),
      Array.from(element.classList)
    )
  }

  static server(
    name: string,
    context: RenderContext,
    commit: ClassNamePartImpl["commit"]
  ) {
    return new ClassNamePartImpl(name, context, commit, null)
  }
}

function diffStrings(
  previous: ReadonlyArray<string> | null | undefined,
  current: ReadonlyArray<string> | null | undefined
) {
  if (previous == null || previous.length === 0) {
    return {
      added: current || [],
      removed: []
    }
  } else if (current == null || current.length === 0) {
    return {
      added: [],
      removed: previous
    }
  } else {
    const added = current.filter((c) => !previous.includes(c))
    const removed = previous.filter((p) => !current.includes(p))

    return {
      added,
      removed
    }
  }
}
