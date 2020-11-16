import { GetSharedValue, Shared, SharedKey } from '../core/exports'

export interface SharedMap<SK extends SharedKey = SharedKey, K = any, V = any>
  extends Shared<SK, unknown, ReadonlyMap<K, V>> {}

export type SharedMapKey<A extends SharedMap> = GetSharedValue<A> extends ReadonlyMap<infer K, any>
  ? K
  : never

export type SharedMapValue<A extends SharedMap> = GetSharedValue<A> extends ReadonlyMap<
  any,
  infer V
>
  ? V
  : never
