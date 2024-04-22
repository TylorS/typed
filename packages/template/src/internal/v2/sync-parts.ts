import { Equivalence } from "effect"
import { equals } from "effect/Equal"
import { isNullOrUndefined, renderToString } from "./helpers.js"
import type * as SyncPart from "./SyncPart.js"

const strictEq = Equivalence.strict<any>()

type CommitParams<T extends SyncPart.SyncPart["_tag"]> = {
  previous: PartValue<T>
  value: PartValue<T>
}

type PartValue<T extends SyncPart.SyncPart["_tag"]> = Extract<SyncPart.SyncPart, { readonly _tag: T }>["value"]

const base = <T extends SyncPart.SyncPart["_tag"]>(tag: T) => (class Base {
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
      value
    })
    return true
  }

  getValue(value: unknown) {
    return value
  }
})

export class AttributePartImpl extends base("attribute") implements SyncPart.AttributeSyncPart {
  constructor(
    readonly name: string,
    index: number,
    commit: (params: CommitParams<"attribute">) => void,
    value: PartValue<"attribute">
  ) {
    super(index, commit, value, strictEq)
  }

  getValue(value: unknown): string | null | undefined {
    return isNullOrUndefined(value) ? value : renderToString(value)
  }
}

export class BooleanPartImpl extends base("boolean") implements SyncPart.BooleanSyncPart {
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

export class ClassNamePartImpl extends base("className") implements SyncPart.ClassNameSyncPart {
  constructor(index: number, commit: (params: CommitParams<"className">) => void, value: PartValue<"className">) {
    super(index, commit, value, strictEq)
  }

  getValue(value: unknown): ReadonlyArray<string> {
    if (isNullOrUndefined(value)) {
      return []
    } else if (Array.isArray(value)) {
      return value.flatMap(splitClassNames)
    } else {
      return splitClassNames(renderToString(value))
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

export class CommentPartImpl extends base("comment") implements SyncPart.CommentSyncPart {
  getValue(value: unknown) {
    return isNullOrUndefined(value) ? value : renderToString(value)
  }
}

export class DataPartImpl extends base("data") implements SyncPart.DataSyncPart {}

export class NodePartImpl extends base("node") implements SyncPart.NodeSyncPart {}

export class PropertyPartImpl extends base("property") implements SyncPart.PropertySyncPart {
  constructor(
    readonly name: string,
    index: number,
    commit: (params: CommitParams<"property">) => void,
    value: PartValue<"property">
  ) {
    super(index, commit, value, strictEq)
  }
}

export class TextPartImpl extends base("text") implements SyncPart.TextSyncPart {
  constructor(index: number, commit: (params: CommitParams<"text">) => void, value: PartValue<"text">) {
    super(index, commit, value, strictEq)
  }

  getValue(value: unknown) {
    return isNullOrUndefined(value) ? value : renderToString(value)
  }
}
