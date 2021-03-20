import { Adapter } from '@typed/fp/Adapter'
import { Namespace } from '@typed/fp/Namespace'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { KvCreated, KvDeleted, KvUpdated } from '../KvEnv'

export interface Shared<F> {
  /**
   * All of the lifecycle events
   */
  readonly sharedEvents: SharedEvents<F>
  /**
   * A *mutable* map of namespaces to key-value pairs
   */
  readonly sharedMap: SharedMap
}

export type SharedEvents<F> = Adapter<SharedEvent<F>, SharedEvent<F>>

export type SharedMap = ReadonlyMap<Namespace, ReadonlyMap<any, any>>

export type SharedEvent<F> = NamespaceEvent<F> | SharedValueEvent<F>

export type NamespaceEvent<F> =
  | NamespaceAborted<F>
  | NamespaceCompleted<F>
  | NamespaceCreated
  | NamespaceDeleted
  | NamespaceRunning<F>
  | NamespaceUpdated

export type NamespaceCreated = {
  readonly type: 'namespace/created'
  readonly namespace: Namespace
  readonly kvMap: ReadonlyMap<any, any>
}

export type NamespaceUpdated = {
  readonly type: 'namespace/updated'
  readonly namespace: Namespace
  readonly kvMap: ReadonlyMap<any, any>
}

export type NamespaceDeleted = {
  readonly type: 'namespace/deleted'
  readonly namespace: Namespace
}

export type NamespaceRunning<F> = {
  readonly type: 'namespace/running'
  readonly parent: Namespace
  readonly namespace: Namespace
  readonly effect: EffectOf<F>
}

export type NamespaceAborted<F> = {
  readonly type: 'namespace/aborted'
  readonly parent: Namespace
  readonly namespace: Namespace
  readonly effect: EffectOf<F>
}

export type NamespaceCompleted<F> = {
  readonly type: 'namespace/completed'
  readonly parent: Namespace
  readonly namespace: Namespace
  readonly effect: EffectOf<F>
  readonly value: unknown
}

export type EffectOf<F> = F extends URIS2
  ? Kind2<F, any, any>
  : F extends URIS3
  ? Kind3<F, any, any, any>
  : F extends URIS4
  ? Kind4<F, any, any, any, any>
  : HKT2<F, any, any>

export type SharedValueEvent<F> =
  | SharedValueCreated<F>
  | SharedValueDeleted<F>
  | SharedValueUpdated<F>

export type SharedValueCreated<F> = KvCreated<F> & { readonly namespace: Namespace }

export type SharedValueUpdated<F> = KvUpdated<F> & { readonly namespace: Namespace }

export type SharedValueDeleted<F> = KvDeleted<F> & { readonly namespace: Namespace }
