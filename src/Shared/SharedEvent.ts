import { KV, KV2, KV3, KV4 } from '@typed/fp/KV'
import { Namespace } from '@typed/fp/Namespace'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

export type SharedEvent<F> = NamespaceEvent<F> | KVEvent<F>

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

export type EffectOf<F, E = any, R = any> = F extends URIS2
  ? Kind2<F, E, R>
  : F extends URIS3
  ? Kind3<F, E, any, R>
  : F extends URIS4
  ? Kind4<F, any, E, any, R>
  : HKT2<F, E, R>

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
 * KV value lifecycle events
 */
export type KVEvent<F> = KVCreated<F> | KVUpdated<F> | KVDeleted<F>

export type KVOf<F> = F extends URIS2
  ? KV2<F, any, any, any>
  : F extends URIS3
  ? KV3<F, any, any, any, any>
  : F extends URIS4
  ? KV4<F, any, any, any, any, any>
  : KV<F, any, any, any>

/**
 * A KV value has been added to the environment for a given namespace.
 */
export type KVCreated<F> = {
  readonly type: 'kv/created'
  readonly namespace: Namespace
  readonly kv: KVOf<F>
  readonly value: unknown
}

/**
 * A KV value has been updated in the environment for a given namespace.
 */
export type KVUpdated<F> = {
  readonly type: 'kv/updated'
  readonly namespace: Namespace
  readonly kv: KVOf<F>
  readonly value: unknown
  readonly previousValue: unknown
}

/**
 * A KV value has been deleted from a given Namespace.
 */
export type KVDeleted<F> = {
  readonly type: 'kv/deleted'
  readonly namespace: Namespace
  readonly kv: KVOf<F>
}
