import { Adapter } from '@most/adapter'
import { URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { KV, KV2, KV3, KV4 } from '../KV'

export type KvEnv<F, K, V> = KvAdapterEnv<F> & KvMapEnv<K, V>

export interface KvAdapterEnv<F> {
  readonly kvEvents: KvAdapter<F>
}

export interface KvMapEnv<K, V> {
  readonly kvMap: ReadonlyMap<K, V>
}

export type KvAdapter<F> = readonly [...Adapter<KvEvent<F>, KvEvent<F>>]

export type KvEvent<F> = KvCreated<F> | KvUpdated<F> | KvDeleted<F>

export interface KvCreated<F> {
  readonly type: 'kv/created'
  readonly kv: KvOf<F>
  readonly value: unknown
}

export interface KvUpdated<F> {
  readonly type: 'kv/updated'
  readonly kv: KvOf<F>
  readonly previousValue: unknown
  readonly value: unknown
}

export interface KvDeleted<F> {
  readonly type: 'kv/deleted'
  readonly kv: KvOf<F>
}

export type KvOf<F, K = any, S = any, R = any, E = any, A = any> = F extends URIS2
  ? KV2<F, K, E, A>
  : F extends URIS3
  ? KV3<F, K, R, E, A>
  : F extends URIS4
  ? KV4<F, K, S, R, E, A>
  : KV<F, K, E, A>
