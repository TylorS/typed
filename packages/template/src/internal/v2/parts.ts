import type { Effect } from "effect"
import { Equivalence } from "effect"
import type { Cause } from "effect/Cause"
import { equals } from "effect/Equal"
import type { ElementSource } from "../../ElementSource.js"
import type { EventHandler } from "../../EventHandler.js"
import { isNullOrUndefined, renderToString } from "./helpers.js"
import type * as Part from "./Part.js"

const strictEq = Equivalence.strict<any>()

type CommitParams<T extends Part.Part["_tag"]> = {
  previous: PartValue<T>
  value: PartValue<T>
  part: Extract<Part.Part, { readonly _tag: T }>
}

type PartValue<T extends Part.Part["_tag"]> = Extract<Part.Part, { readonly _tag: T }>["value"]

const base = <T extends Part.Part["_tag"]>(tag: T) => (class Base {
  readonly _tag: T = tag

  constructor(
    readonly index: number,
    readonly commit: (params: CommitParams<T>) => void,
    public value: PartValue<T>,
    readonly eq: Equivalence.Equivalence<PartValue<T>> = equals
  ) {
    this.update = this.update.bind(this)
  }

  update(input: this["value"]) {
    const previous = this.value as any
    const value = this.getValue(input) as any

    if (this.eq(previous as any, value as any)) {
      return false
    }

    this.value = value

    this.commit.call(this, {
      previous,
      value,
      part: this as any
    })
    return true
  }

  getValue(value: unknown) {
    return value
  }
})

export class AttributePartImpl extends base("attribute") implements Part.AttributePart {
  constructor(
    readonly name: string,
    index: number,
    commit: (params: CommitParams<"attribute">) => void,
    value: PartValue<"attribute">
  ) {
    super(index, commit, value, strictEq)
  }
}

export class BooleanPartImpl extends base("boolean") implements Part.BooleanPart {
  constructor(
    readonly name: string,
    index: number,
    commit: (params: CommitParams<"boolean">) => void,
    value: PartValue<"boolean">
  ) {
    super(index, commit, value, strictEq)
  }

  getValue(value: unknown): boolean {
    return !!value
  }
}

export class ClassNamePartImpl extends base("className") implements Part.ClassNamePart {
  constructor(index: number, commit: (params: CommitParams<"className">) => void, value: PartValue<"className">) {
    super(index, commit, value, strictEq)
  }

  getValue(value: unknown): ReadonlyArray<string> {
    if (Array.isArray(value)) {
      return value.flatMap(splitClassNames)
    } else if (typeof value === "string") {
      return splitClassNames(value)
    } else {
      return []
    }
  }
}

const SPACE_REGEXP = /\s+/g

export function splitClassNames(value: string) {
  return value.split(SPACE_REGEXP).flatMap((a) => {
    const trimmed = a.trim()
    return trimmed.length > 0 ? [trimmed] : []
  })
}

export class CommentPartImpl extends base("comment") implements Part.CommentPart {
  getValue(value: unknown) {
    return isNullOrUndefined(value) ? value : renderToString(value)
  }
}

export class DataPartImpl extends base("data") implements Part.DataPart {}

export class EventPartImpl implements Part.EventPart {
  readonly _tag = "event"
  readonly value: Part.EventPart["value"] = null

  constructor(
    readonly name: string,
    readonly index: number,
    readonly source: ElementSource<any>,
    readonly onCause: <E>(cause: Cause<E>) => Effect.Effect<unknown>,
    readonly addEventListener: <Ev extends Event>(handler: EventHandler<Ev>) => void
  ) {
  }
}

export class NodePartImpl extends base("node") implements Part.NodePart {}

export class PropertyPartImpl extends base("property") implements Part.PropertyPart {
  constructor(
    readonly name: string,
    index: number,
    commit: (params: CommitParams<"property">) => void,
    value: PartValue<"property">
  ) {
    super(index, commit, value, strictEq)
  }
}

export class RefPartImpl extends base("ref") implements Part.RefPart {}

export class TextPartImpl extends base("text") implements Part.TextPart {}
