import { Branded } from './Branded'

/**
 * A WeakKey is a reference to an object which is intended to be used a key inside
 * of a WeakMap.
 */
export type WeakKey = Branded<{ readonly WeakKey: unique symbol }, object>
export const WeakKey = Branded<WeakKey>()

export interface WeakKeyMap<A> extends WeakMap<WeakKey, A> {}
