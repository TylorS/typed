import type { Cause } from "effect/Cause"
import * as Effect from "effect/Effect"
import { equals } from "effect/Equal"
import * as Equivalence from "effect/Equivalence"
import type { Scope } from "effect/Scope"
import type { ElementSource } from "../ElementSource.js"
import type { EventHandler } from "../EventHandler.js"
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
  TextPart
} from "../Part.js"
import { DEFAULT_PRIORITY } from "../RenderQueue.js"

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
      priority: number
    ) => Effect.Effect<void, never, Scope>,
    public value: Extract<Part, { readonly _tag: T }>["value"],
    readonly eq: Equivalence.Equivalence<Extract<Part, { readonly _tag: T }>["value"]> = equals
  ) {
    this.update = this.update.bind(this)
  }

  update(input: this["value"], priority: number = DEFAULT_PRIORITY) {
    const previous = this.value as any
    const value = this.getValue(input) as any

    if (this.eq(previous as any, value as any)) {
      return Effect.void
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
}

export class CommentPartImpl extends base("comment") implements CommentPart {}

export class DataPartImpl extends base("data") implements DataPart {}

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
}

export class PropertiesPartImpl extends base("properties") implements PropertiesPart {
  constructor(
    index: number,
    commit: PropertiesPartImpl["commit"],
    value: PropertiesPartImpl["value"]
  ) {
    super(index, commit, value, strictEq)
  }
}

export class RefPartImpl implements RefPart {
  readonly _tag = "ref"

  constructor(readonly value: ElementSource<any>, readonly index: number) {}
}

export class TextPartImpl extends base("text") implements TextPart {}
