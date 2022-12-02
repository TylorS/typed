import { SK } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'

import { Effect } from '../Effect/Effect.js'
import * as ops from '../Effect/operators.js'

export interface FiberRef<R, E, A> {
  readonly id: FiberRefId<A>
  readonly initial: Effect<R, E, A>
  readonly fork: (current: A) => Option.Option<A>
  readonly join: (current: A, incoming: A) => A

  readonly [Symbol.iterator]: () => Generator<Effect<R, E, A>, A, A>

  readonly as: (id: FiberRefId<A>) => FiberRef<R, E, A>
}

export type FiberRefOptions<A> = {
  readonly id?: FiberRefId<A>
  readonly name?: string
  readonly fork?: (current: A) => Option.Option<A>
  readonly join?: (current: A, incoming: A) => A
}

export function FiberRef<R, E, A>(
  initial: Effect<R, E, A>,
  options: FiberRefOptions<A> = {},
): FiberRef<R, E, A> {
  const ref: FiberRef<R, E, A> = {
    id: options.id ?? FiberRefId(options.name),
    initial,
    fork: options.fork ?? Option.some,
    join: options.join ?? SK,
    [Symbol.iterator]: () => ops.getFiberRef(ref)[Symbol.iterator](),
    as: (id) => ({
      ...ref,
      id,
    }),
  }

  return ref
}

export namespace FiberRef {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  export type ResourcesOf<T> = T extends FiberRef<infer R, infer _E, infer _A> ? R : never
  export type ErrorsOf<T> = T extends FiberRef<infer _R, infer E, infer _A> ? E : never
  export type OutputOf<T> = T extends FiberRef<infer _R, infer _E, infer A> ? A : never
  /* eslint-enable @typescript-eslint/no-unused-vars */
}

export type FiberRefId<A> = symbol & FiberRefId.Brand<A>

export function FiberRefId<A>(name?: string): FiberRefId<A> {
  return Symbol(name) as FiberRefId<A>
}

export namespace FiberRefId {
  export interface Brand<A> {
    readonly FIBER_REF_ID: A
  }
}
