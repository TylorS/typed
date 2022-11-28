import { identity } from '@fp-ts/data/Function'
import { Exit } from '@typed/exit'

import type { Effect } from '../effect/Effect.js'

import { FiberId } from './FiberId.js'

export interface Fiber<E, A> extends Fiber.Variance<E, A> {
  readonly id: FiberId
  readonly exit: Effect<never, never, Exit<E, A>>
  readonly join: Effect<never, E, A>
}

export namespace Fiber {
  export const TypeId = Symbol('@typed/io/Fiber')
  export type TypeId = typeof TypeId

  export interface Variance<E, A> {
    readonly [TypeId]: {
      readonly _E: (_: never) => E
      readonly _A: (_: A) => A
    }
  }

  export const Variance: Variance<any, any>[TypeId] = {
    _E: identity,
    _A: identity,
  }
}

export function isFiber<E, A>(v: unknown): v is Fiber<E, A> {
  return typeof v === 'object' && v != null && Fiber.TypeId in v
}
