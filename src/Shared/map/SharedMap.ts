import { GetSharedValue, Shared, SharedKey } from '../core/exports'

/**
 * A ReadonlyMap Shared value
 */
export interface SharedMap<SK extends SharedKey = SharedKey, K = any, V = any>
  extends Shared<SK, unknown, ReadonlyMap<K, V>> {}

/**
 * Extract the keys of a SharedMap
 */
export type SharedMapKey<A extends SharedMap> = GetSharedValue<A> extends ReadonlyMap<infer K, any>
  ? K
  : never

/**
 * Extract the values of a SharedMap
 */
export type SharedMapValue<A extends SharedMap> = GetSharedValue<A> extends ReadonlyMap<
  any,
  infer V
>
  ? V
  : never
