import type { Effect } from '@typed/fp/Effect/Effect'
import { createRuntimeSchema, createSchema } from '@typed/fp/io/exports'
import type { HKT } from 'fp-ts/HKT'

import { Namespace } from '../model/Namespace'

/**
 * All of the Namespace-specific events
 */
export type NamespaceEvent =
  | NamespaceCreated
  | NamespaceStarted
  | NamespaceUpdated
  | NamespaceCompleted
  | NamespaceDeleted

export namespace NamespaceEvent {
  export const schema = createRuntimeSchema((t) =>
    t.union(
      NamespaceCreated.schema(t),
      NamespaceStarted.schema(t),
      NamespaceUpdated.schema(t),
      NamespaceCompleted.schema(t),
      NamespaceDeleted.schema(t),
    ),
  )
}

/**
 * When a Namespace is added to the environment
 */
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

/**
 * When an Effect correlated to a namespace is being run.
 */
export type NamespaceStarted = {
  readonly type: 'namespace/started'
  readonly parent: Namespace
  readonly namespace: Namespace
  readonly effect: Effect<any, any>
}

export namespace NamespaceStarted {
  export const schema = createRuntimeSchema<NamespaceStarted>((t) =>
    t.type({
      type: t.literal('namespace/started'),
      parent: Namespace.schema(t),
      namespace: Namespace.schema(t),
      effect: t.unknown as HKT<any, Effect<any, any>>,
    }),
  )
}

/**
 * When a namespace has changed.
 */
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

/**
 * When an Effect related to a specific Namespace has completed.
 */
export type NamespaceCompleted = {
  readonly type: 'namespace/completed'
  readonly parent: Namespace
  readonly namespace: Namespace
  readonly effect: Effect<any, any>
  readonly returnValue: unknown
}

export namespace NamespaceCompleted {
  export const schema = createRuntimeSchema<NamespaceCompleted>((t) =>
    t.type({
      type: t.literal('namespace/completed'),
      parent: Namespace.schema(t),
      namespace: Namespace.schema(t),
      returnValue: t.unknown,
      effect: t.unknown as HKT<any, Effect<any, any>>,
    }),
  )
}

/**
 * When a Namespace is being deleted from the environment.
 */
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
