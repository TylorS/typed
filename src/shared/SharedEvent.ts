import { createSchema } from '@typed/fp/io/exports'

import { Shared } from './Shared'

export type SharedEvent = NamespaceEvent | SharedValueEvent

export type NamespaceEvent =
  | NamespaceCreated
  | NamespaceStarted
  | NamespaceUpdated
  | NamespaceCompleted
  | NamespaceDeleted

export type NamespaceCreated = {
  readonly type: 'namespace/created'
  readonly namespace: PropertyKey
}

export namespace NamespaceCreated {
  export const schema = createSchema<NamespaceCreated>((t) =>
    t.type({
      type: t.literal('namespace/created'),
      namespace: t.union(t.string, t.number, t.symbol),
    }),
  )
}

export type NamespaceStarted = {
  readonly type: 'namespace/started'
  readonly namespace: PropertyKey
}

export namespace NamespaceStarted {
  export const schema = createSchema<NamespaceStarted>((t) =>
    t.type({
      type: t.literal('namespace/started'),
      namespace: t.union(t.string, t.number, t.symbol),
    }),
  )
}

export type NamespaceUpdated = {
  readonly type: 'namespace/updated'
  readonly namespace: PropertyKey
}

export namespace NamespaceUpdated {
  export const schema = createSchema<NamespaceUpdated>((t) =>
    t.type({
      type: t.literal('namespace/updated'),
      namespace: t.union(t.string, t.number, t.symbol),
    }),
  )
}

export type NamespaceCompleted = {
  readonly type: 'namespace/completed'
  readonly namespace: PropertyKey
  readonly returnValue: unknown
}

export namespace NamespaceCompleted {
  export const schema = createSchema<NamespaceCompleted>((t) =>
    t.type({
      type: t.literal('namespace/completed'),
      namespace: t.union(t.string, t.number, t.symbol),
      returnValue: t.unknown,
    }),
  )
}

export type NamespaceDeleted = {
  readonly type: 'namespace/deleted'
  readonly namespace: PropertyKey
}

export namespace NamespaceDeleted {
  export const schema = createSchema<NamespaceDeleted>((t) =>
    t.type({
      type: t.literal('namespace/deleted'),
      namespace: t.union(t.string, t.number, t.symbol),
    }),
  )
}

export type SharedValueEvent = SharedValueCreated | SharedValueUpdated | SharedValueDeleted

export type SharedValueCreated = {
  readonly type: 'sharedValue/created'
  readonly namespace: PropertyKey
  readonly shared: Shared
  readonly value: unknown
}

export namespace SharedValueCreated {
  export const schema = createSchema<SharedValueCreated>((t) =>
    t.type({
      type: t.literal('sharedValue/created'),
      namespace: t.union(t.string, t.number, t.symbol),
      shared: Shared.schema(t),
      value: t.unknown,
    }),
  )
}

export type SharedValueUpdated = {
  readonly type: 'sharedValue/updated'
  readonly namespace: PropertyKey
  readonly shared: Shared
  readonly value: unknown
  readonly previousValue: unknown
}

export namespace SharedValueUpdated {
  export const schema = createSchema<SharedValueUpdated>((t) =>
    t.type({
      type: t.literal('sharedValue/updated'),
      namespace: t.union(t.string, t.number, t.symbol),
      shared: Shared.schema(t),
      value: t.unknown,
      previousValue: t.unknown,
    }),
  )
}

export type SharedValueDeleted = {
  readonly type: 'sharedValue/deleted'
  readonly namespace: PropertyKey
  readonly shared: Shared
}

export namespace SharedValueDeleted {
  export const schema = createSchema<SharedValueDeleted>((t) =>
    t.type({
      type: t.literal('sharedValue/deleted'),
      namespace: t.union(t.string, t.number, t.symbol),
      shared: Shared.schema(t),
    }),
  )
}
