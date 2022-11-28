import { identity } from '@fp-ts/data/Function'
import { Disposable } from '@typed/disposable'
import { Exit } from '@typed/exit'

import type { Effect } from '../effect/Effect.js'
import { FiberRefs } from '../fiberRefs/fiberRefs.js'
import { Platform } from '../platform/platform.js'
import { RuntimeFlags } from '../runtimeFlags/RuntimeFlags.js'

import { FiberId } from './FiberId.js'

export type Fiber<E, A> = SyntheticFiber<E, A> | LiveFiber<E, A>

export interface SyntheticFiber<E, A> extends Fiber.Variance<E, A> {
  readonly _tag: 'Synthetic'
  readonly exit: Effect.Of<Exit<E, A>>
  readonly id: FiberId
  readonly inheritFiberRefs: Effect.Of<void>
  readonly interruptAs: (id: FiberId) => Effect.Of<Exit<E, A>>
  readonly join: Effect<never, E, A>
}

export interface LiveFiber<E, A> extends Omit<SyntheticFiber<E, A>, '_tag'> {
  readonly _tag: 'Live'
  readonly addObserver: (observer: Fiber.Observer<E, A>) => Disposable
  readonly fiberRefs: Effect.Of<FiberRefs>
  readonly platform: Effect.Of<Platform>
  readonly runtimeFlags: Effect.Of<RuntimeFlags>
  readonly trace: Effect.Of<Effect.Trace>
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

  export interface Observer<E, A> {
    (exit: Exit<E, A>): void
  }
}

export function isFiber<E, A>(v: unknown): v is Fiber<E, A> {
  return typeof v === 'object' && v != null && Fiber.TypeId in v
}
