/**
 * A synchronous effect
 */
export interface Sync<A> {
  readonly async: false
  readonly value: A
}

/**
 * Resume an effect synchronously
 */
export const sync = <A>(value: A): Sync<A> => ({ async: false, value })
