import type { Cause } from "effect"
import * as Effect from "effect/Effect"
import type { Scope } from "effect/Scope"
import type { ElementSource } from "../../ElementSource.js"
import type { EventHandler } from "../../EventHandler.js"
import type * as Part from "../../Part.js"
import { DEFAULT_PRIORITY } from "../../RenderQueue.js"
import type * as SyncPart from "./SyncPart.js"

const base = <T extends SyncPart.SyncPart["_tag"]>(tag: T) => (class Base {
  readonly _tag: T = tag

  constructor(
    readonly sync: Extract<SyncPart.SyncPart, { readonly _tag: T }>,
    readonly commit: (
      params: {
        previous: Extract<SyncPart.SyncPart, { readonly _tag: T }>["value"]
        value: Extract<SyncPart.SyncPart, { readonly _tag: T }>["value"]
        part: Extract<Part.Part, { readonly _tag: T }>
      },
      priority: number
    ) => Effect.Effect<void, never, Scope>
  ) {
    this.update = this.update.bind(this)
  }

  update(input: any, priority: number = DEFAULT_PRIORITY) {
    const current = this.sync.value
    if (this.sync.update(input)) {
      return this.commit(
        {
          previous: current,
          value: input,
          part: this as any
        } as any,
        priority
      )
    }
    return Effect.void
  }

  get value() {
    return this.sync.value as Extract<Part.Part, { readonly _tag: T }>["value"]
  }
})

export class AttributePartImpl extends base("attribute") implements Part.AttributePart {
  readonly name: string
  readonly index: number

  constructor(
    readonly sync: SyncPart.AttributeSyncPart,
    commit: (
      params: {
        previous: SyncPart.AttributeSyncPart["value"]
        value: SyncPart.AttributeSyncPart["value"]
        part: Part.AttributePart
      },
      priority: number
    ) => Effect.Effect<void, never, Scope>
  ) {
    super(sync, commit)
    this.name = sync.name
    this.index = sync.index
  }
}

export class BooleanPartImpl extends base("boolean") implements Part.BooleanPart {
  readonly name: string
  readonly index: number

  constructor(
    readonly sync: SyncPart.BooleanSyncPart,
    commit: (
      params: {
        previous: SyncPart.BooleanSyncPart["value"]
        value: SyncPart.BooleanSyncPart["value"]
        part: Part.BooleanPart
      },
      priority: number
    ) => Effect.Effect<void, never, Scope>
  ) {
    super(sync, commit)
    this.name = sync.name
    this.index = sync.index
  }
}

export class ClassNamePartImpl extends base("className") implements Part.ClassNamePart {
  readonly index: number

  constructor(
    readonly sync: SyncPart.ClassNameSyncPart,
    commit: (
      params: {
        previous: SyncPart.ClassNameSyncPart["value"]
        value: SyncPart.ClassNameSyncPart["value"]
        part: Part.ClassNamePart
      },
      priority: number
    ) => Effect.Effect<void, never, Scope>
  ) {
    super(sync, commit)
    this.index = sync.index
  }
}

export class CommentPartImpl extends base("comment") implements Part.CommentPart {
  readonly index: number

  constructor(
    readonly sync: SyncPart.CommentSyncPart,
    commit: (
      params: {
        previous: SyncPart.CommentSyncPart["value"]
        value: SyncPart.CommentSyncPart["value"]
        part: Part.CommentPart
      },
      priority: number
    ) => Effect.Effect<void, never, Scope>
  ) {
    super(sync, commit)
    this.index = sync.index
  }
}

export class DataPartImpl extends base("data") implements Part.DataPart {
  readonly index: number

  constructor(
    readonly sync: SyncPart.DataSyncPart,
    commit: (
      params: {
        previous: SyncPart.DataSyncPart["value"]
        value: SyncPart.DataSyncPart["value"]
        part: Part.DataPart
      },
      priority: number
    ) => Effect.Effect<void, never, Scope>
  ) {
    super(sync, commit)
    this.index = sync.index
  }
}

export class EventPartImpl implements Part.EventPart {
  readonly _tag = "event"
  readonly value: Part.EventPart["value"] = null

  constructor(
    readonly name: string,
    readonly index: number,
    readonly source: ElementSource<any>,
    readonly onCause: <E>(cause: Cause.Cause<E>) => Effect.Effect<unknown>,
    readonly addEventListener: <Ev extends Event>(handler: EventHandler<Ev>) => void
  ) {
  }
}

export class NodePartImpl extends base("node") implements Part.NodePart {
  readonly index: number

  constructor(
    readonly sync: SyncPart.NodeSyncPart,
    commit: (
      params: {
        previous: SyncPart.NodeSyncPart["value"]
        value: SyncPart.NodeSyncPart["value"]
        part: Part.NodePart
      },
      priority: number
    ) => Effect.Effect<void, never, Scope>
  ) {
    super(sync, commit)
    this.index = sync.index
  }
}

export class PropertyPartImpl extends base("property") implements Part.PropertyPart {
  readonly name: string
  readonly index: number

  constructor(
    readonly sync: SyncPart.PropertySyncPart,
    commit: (
      params: {
        previous: SyncPart.PropertySyncPart["value"]
        value: SyncPart.PropertySyncPart["value"]
        part: Part.PropertyPart
      },
      priority: number
    ) => Effect.Effect<void, never, Scope>
  ) {
    super(sync, commit)
    this.name = sync.name
    this.index = sync.index
  }
}

export class PropertiesPartImpl extends base("properties") implements Part.PropertiesPart {
  readonly index: number

  constructor(
    readonly sync: SyncPart.PropertiesSyncPart,
    commit: (
      params: {
        previous: SyncPart.PropertiesSyncPart["value"]
        value: SyncPart.PropertiesSyncPart["value"]
        part: Part.PropertiesPart
      },
      priority: number
    ) => Effect.Effect<void, never, Scope>
  ) {
    super(sync, commit)
    this.index = sync.index
  }
}

export class RefPartImpl implements Part.RefPart {
  readonly _tag = "ref"

  constructor(readonly value: ElementSource<any>, readonly index: number) {}
}

export class TextPartImpl extends base("text") implements Part.TextPart {
  readonly index: number

  constructor(
    readonly sync: SyncPart.TextSyncPart,
    commit: (
      params: {
        previous: SyncPart.TextSyncPart["value"]
        value: SyncPart.TextSyncPart["value"]
        part: Part.TextPart
      },
      priority: number
    ) => Effect.Effect<void, never, Scope>
  ) {
    super(sync, commit)
    this.index = sync.index
  }
}

export function syncPartToPart<T extends SyncPart.SyncPart>(
  part: SyncPart.SyncPart,
  commit: (
    params: {
      previous: SyncPart.TextSyncPart["value"]
      value: SyncPart.TextSyncPart["value"]
      part: Extract<Part.Part, { readonly _tag: T["_tag"] }>
    },
    priority: number
  ) => Effect.Effect<void, never, Scope>
): Extract<Part.Part, { readonly _tag: T["_tag"] }> {
  switch (part._tag) {
    case "attribute":
      return new AttributePartImpl(part, commit as any) as any
    case "boolean":
      return new BooleanPartImpl(part, commit as any) as any
    case "className":
      return new ClassNamePartImpl(part, commit as any) as any
    case "comment":
      return new CommentPartImpl(part, commit as any) as any
    case "data":
      return new DataPartImpl(part, commit as any) as any
    case "node":
      return new NodePartImpl(part, commit as any) as any
    case "property":
      return new PropertyPartImpl(part, commit as any) as any
    case "properties":
      return new PropertiesPartImpl(part, commit as any) as any
    case "text":
      return new TextPartImpl(part, commit as any) as any
  }
}
