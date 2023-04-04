import { identity } from '@effect/data/Function'
import { type Option, none } from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'

import { Mutable } from '../_internal/Mutable.js'
import { never } from '../constructor/never.js'
import { HoldFx } from '../operator/hold.js'

import { isSubject, Subject } from './Subject.js'

export interface HoldSubject<E, A> extends Subject<E, A>, HoldSubject.Variance<E, A> {
  readonly value: Effect.Effect<never, never, Option<A>>

  /**
   * @internal
   */
  readonly current: Mutable<Option<A>>
}

export namespace HoldSubject {
  export const TypeId = Symbol.for('@typed/fx/HoldSubject')
  export type TypeId = typeof TypeId

  export abstract class Variance<E, A> extends Subject.Variance<E, A> {
    readonly [TypeId]: {
      readonly _E: (_: never) => E
      readonly _A: (_: never) => A
    } = {
      _E: identity,
      _A: identity,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type ErrorsOf<T> = [T] extends [Variance<infer E, infer _A>] ? E : never

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type OutputsOf<T> = [T] extends [Variance<infer _E, infer A>] ? A : never

  export function unsafeMake<E, A>(value: Mutable<Option<A>> = Mutable(none())): HoldSubject<E, A> {
    return new HoldSubjectImpl(value)
  }

  class HoldSubjectImpl<E, A> extends HoldFx<never, E, A> implements HoldSubject<E, A> {
    readonly [Subject.TypeId]: Subject.Variance<E, A>[Subject.TypeId] = {
      _E: identity,
      _A: identity,
    };
    readonly [TypeId]: HoldSubject.Variance<E, A>[TypeId] = this[Subject.TypeId]

    constructor(value: Mutable<Option<A>>) {
      super(never, value)
    }

    readonly value = Effect.sync(() => this.current.get())
  }
}

export function isHoldSubject<E, A>(u: unknown): u is HoldSubject<E, A> {
  return isSubject(u) && HoldSubject.TypeId in u
}
