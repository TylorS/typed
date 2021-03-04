import { Namespace } from '@typed/fp/Namespace'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { Shared, Shared2, Shared3, Shared4 } from '../Shared/Shared'

export type SharedEvent<F> = NamespaceEvent<F> | SharedValueEvent<F>

/**
 * All of the Namespace-specific events
 */
export type NamespaceEvent<F> =
  | NamespaceCreated
  | NamespaceStarted<F>
  | NamespaceUpdated
  | NamespaceCompleted<F>
  | NamespaceDeleted

/**
 * When a Namespace is added to the environment
 */
export type NamespaceCreated = {
  readonly type: 'namespace/created'
  readonly namespace: Namespace
}

/**
 * When an Effect correlated to a namespace is being run.
 */
export type NamespaceStarted<F> = {
  readonly type: 'namespace/started'
  readonly parent: Namespace
  readonly namespace: Namespace
  readonly effect: EffectOf<F>
}

export type EffectOf<F> = F extends URIS2
  ? Kind2<F, any, any>
  : F extends URIS3
  ? Kind3<F, any, any, any>
  : F extends URIS4
  ? Kind4<F, any, any, any, any>
  : HKT2<F, any, any>

/*
 * When a namespace has changed.
 */
export type NamespaceUpdated = {
  readonly type: 'namespace/updated'
  readonly namespace: Namespace
}

/**
 * When an Effect related to a specific Namespace has completed.
 */
export type NamespaceCompleted<F> = {
  readonly type: 'namespace/completed'
  readonly parent: Namespace
  readonly namespace: Namespace
  readonly effect: EffectOf<F>
  readonly returnValue: unknown
}

/**
 * When an Namespace has been removed.
 */
export type NamespaceDeleted = {
  readonly type: 'namespace/deleted'
  readonly namespace: Namespace
}

/**
 * Shared value lifecycle events
 */
export type SharedValueEvent<F> =
  | SharedValueCreated<F>
  | SharedValueUpdated<F>
  | SharedValueDeleted<F>

export type SharedOf<F> = F extends URIS2
  ? Shared2<F, any, any, any>
  : F extends URIS3
  ? Shared3<F, any, any, any, any>
  : F extends URIS4
  ? Shared4<F, any, any, any, any, any>
  : Shared<F, any, any>

/**
 * A Shared value has been added to the environment for a given namespace.
 */
export type SharedValueCreated<F> = {
  readonly type: 'sharedValue/created'
  readonly namespace: Namespace
  readonly shared: SharedOf<F>
  readonly value: unknown
}

/**
 * A Shared value has been updated in the environment for a given namespace.
 */
export type SharedValueUpdated<F> = {
  readonly type: 'sharedValue/updated'
  readonly namespace: Namespace
  readonly shared: SharedOf<F>
  readonly value: unknown
  readonly previousValue: unknown
}

/**
 * A Shared value has been deleted from a given Namespace.
 */
export type SharedValueDeleted<F> = {
  readonly type: 'sharedValue/deleted'
  readonly namespace: Namespace
  readonly shared: SharedOf<F>
}
