import { GetSharedValue, Shared, SharedKey } from '../core/exports'

/**
 * A ReadonlySet Shared value
 */
export interface SharedSet<SK extends SharedKey = SharedKey, V = any>
  extends Shared<SK, unknown, ReadonlySet<V>> {}

/**
 * Extract the value from a SharedSet
 */
export type SharedSetValue<A extends SharedSet> = GetSharedValue<A> extends ReadonlySet<infer V>
  ? V
  : never
