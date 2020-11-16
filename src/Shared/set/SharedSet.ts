import { GetSharedValue, Shared, SharedKey } from '../core/exports'

export interface SharedSet<SK extends SharedKey = SharedKey, V = any>
  extends Shared<SK, unknown, ReadonlySet<V>> {}

export type SharedSetValue<A extends SharedSet> = GetSharedValue<A> extends ReadonlySet<infer V>
  ? V
  : never
