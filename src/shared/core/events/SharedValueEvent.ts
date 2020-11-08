import { createSchema } from '@typed/fp/io/exports'

import { Namespace } from '../model/Namespace'
import { Shared } from '../model/Shared'

export type SharedValueEvent = SharedValueCreated | SharedValueUpdated | SharedValueDeleted

export namespace SharedValueEvent {
  export const schema = createSchema<SharedValueEvent>((t) =>
    t.union(
      SharedValueCreated.schema(t),
      SharedValueUpdated.schema(t),
      SharedValueDeleted.schema(t),
    ),
  )
}

export type SharedValueCreated = {
  readonly type: 'sharedValue/created'
  readonly namespace: Namespace
  readonly shared: Shared
  readonly value: unknown
}

export namespace SharedValueCreated {
  export const schema = createSchema<SharedValueCreated>((t) =>
    t.type({
      type: t.literal('sharedValue/created'),
      namespace: Namespace.schema(t),
      shared: Shared.schema(t),
      value: t.unknown,
    }),
  )
}

export type SharedValueUpdated = {
  readonly type: 'sharedValue/updated'
  readonly namespace: Namespace
  readonly shared: Shared
  readonly value: unknown
  readonly previousValue: unknown
}

export namespace SharedValueUpdated {
  export const schema = createSchema<SharedValueUpdated>((t) =>
    t.type({
      type: t.literal('sharedValue/updated'),
      namespace: Namespace.schema(t),
      shared: Shared.schema(t),
      value: t.unknown,
      previousValue: t.unknown,
    }),
  )
}

export type SharedValueDeleted = {
  readonly type: 'sharedValue/deleted'
  readonly namespace: Namespace
  readonly shared: Shared
}

export namespace SharedValueDeleted {
  export const schema = createSchema<SharedValueDeleted>((t) =>
    t.type({
      type: t.literal('sharedValue/deleted'),
      namespace: Namespace.schema(t),
      shared: Shared.schema(t),
    }),
  )
}
