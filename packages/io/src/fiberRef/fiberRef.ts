import { identity } from '@fp-ts/data/Function'
import { Option } from '@fp-ts/data/Option'
import { Effect } from '@typed/io/effect/index.js'

export interface FiberRef<R, E, A> extends FiberRef.Variance<R, E, A> {
  readonly initial: Effect<R, E, A>
  readonly fork: (a: A) => Option<A>
  readonly join: (current: A, incoming: A) => A
  readonly equals: (x: A, y: A) => boolean
}

export namespace FiberRef {
  export const TypeId = Symbol('@typed/io/FiberRef')
  export type TypeId = typeof TypeId

  export interface Variance<R, E, A> {
    readonly [TypeId]: {
      readonly _R: (_: never) => R
      readonly _E: (_: never) => E
      readonly _A: (_: A) => A
    }
  }

  export const Variance: Variance<any, any, any>[TypeId] = {
    _R: identity,
    _E: identity,
    _A: identity,
  }
}

export function isFiberRef<R, E, A>(v: unknown): v is FiberRef<R, E, A> {
  return typeof v === 'object' && v != null && FiberRef.TypeId in v
}
