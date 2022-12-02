import { SK } from '@fp-ts/data/Function'
import { Option, some } from '@fp-ts/data/Option'

import { Effect, getFiberRef } from './Effect/Effect.js'

export interface FiberRef<R, E, A> {
  readonly id: FiberRefId<A>
  readonly initial: Effect<R, E, A>
  readonly fork: (current: A) => Option<A>
  readonly join: (current: A, incoming: A) => A

  readonly [Symbol.iterator]: () => Generator<Effect<R, E, A>, A, A>

  readonly as: (id: FiberRefId<A>) => FiberRef<R, E, A>
}

export type FiberRefId<A> = symbol & FIBER_REF_ID<A>

export interface FIBER_REF_ID<A> {
  readonly FIBER_REF_ID: A
}

export function FiberRefId<A>(name?: string): FiberRefId<A> {
  return Symbol(name) as FiberRefId<A>
}

export type FiberRefOptions<A> = {
  readonly id?: FiberRefId<A>
  readonly name?: string
  readonly fork?: (current: A) => Option<A>
  readonly join?: (current: A, incoming: A) => A
}

export function FiberRef<R, E, A>(
  initial: Effect<R, E, A>,
  options: FiberRefOptions<A> = {},
): FiberRef<R, E, A> {
  const ref: FiberRef<R, E, A> = {
    id: options.id ?? FiberRefId(options.name),
    initial,
    fork: options.fork ?? some,
    join: options.join ?? SK,
    [Symbol.iterator]: () => getFiberRef(ref)[Symbol.iterator](),
    as: (id) => ({
      ...ref,
      id,
    }),
  }

  return ref
}
