import type { Effect } from '@typed/fp/Effect/Effect'
import { createSchema } from '@typed/fp/io/exports'
import type { Namespace } from '@typed/fp/Shared/domain/exports'
import type { HKT } from 'fp-ts/HKT'

export type NamespaceEvent =
  | NamespaceCreated
  | NamespaceStarted
  | NamespaceUpdated
  | NamespaceCompleted
  | NamespaceDeleted

export namespace NamespaceEvent {
  export const schema = createSchema((t) =>
    t.union(
      NamespaceCreated.schema(t),
      NamespaceStarted.schema(t),
      NamespaceUpdated.schema(t),
      NamespaceCompleted.schema(t),
      NamespaceDeleted.schema(t),
    ),
  )
}

export type NamespaceCreated = {
  readonly type: 'namespace/created'
  readonly namespace: Namespace
}

export namespace NamespaceCreated {
  export const schema = createSchema<NamespaceCreated>((t) =>
    t.type({
      type: t.literal('namespace/created'),
      namespace: Namespace.schema(t),
    }),
  )
}

export type NamespaceStarted = {
  readonly type: 'namespace/started'
  readonly parent: Namespace
  readonly namespace: Namespace
  readonly effect: Effect<any, any>
}

export namespace NamespaceStarted {
  export const schema = createSchema<NamespaceStarted>((t) =>
    t.type({
      type: t.literal('namespace/started'),
      parent: Namespace.schema(t),
      namespace: Namespace.schema(t),
      effect: t.unknown as HKT<any, Effect<any, any>>,
    }),
  )
}

export type NamespaceUpdated = {
  readonly type: 'namespace/updated'
  readonly namespace: Namespace
}

export namespace NamespaceUpdated {
  export const schema = createSchema<NamespaceUpdated>((t) =>
    t.type({
      type: t.literal('namespace/updated'),
      namespace: Namespace.schema(t),
    }),
  )
}

export type NamespaceCompleted = {
  readonly type: 'namespace/completed'
  readonly namespace: Namespace
  readonly returnValue: unknown
}

export namespace NamespaceCompleted {
  export const schema = createSchema<NamespaceCompleted>((t) =>
    t.type({
      type: t.literal('namespace/completed'),
      namespace: Namespace.schema(t),
      returnValue: t.unknown,
    }),
  )
}

export type NamespaceDeleted = {
  readonly type: 'namespace/deleted'
  readonly namespace: Namespace
}

export namespace NamespaceDeleted {
  export const schema = createSchema<NamespaceDeleted>((t) =>
    t.type({
      type: t.literal('namespace/deleted'),
      namespace: Namespace.schema(t),
    }),
  )
}
