import * as Effect from '@effect/io/Effect'
import { identity } from '@fp-ts/data/Function'
import { MutableRef, make } from '@fp-ts/data/MutableRef'
import { Option, none } from '@fp-ts/data/Option'

import { Fx, Sink } from '../Fx.js'
import { never } from '../constructor/never.js'
import { HoldFx } from '../operator/hold.js'

import { Subject } from './Subject.js'

export interface HoldSubject<E, A>
  extends Fx<never, E, A>,
    Sink<never, E, A>,
    Subject.Variance<E, A>,
    HoldSubject.Variance<E, A> {
  readonly get: Effect.Effect<never, never, Option<A>>
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

  export function unsafeMake<E, A>(value: MutableRef<Option<A>> = make(none)): HoldSubject<E, A> {
    return new HoldSubjectImpl(value)
  }

  class HoldSubjectImpl<E, A> extends HoldFx<never, E, A> implements HoldSubject<E, A> {
    readonly [Subject.TypeId]: Subject.Variance<E, A>[Subject.TypeId] = {
      _E: identity,
      _A: identity,
    };
    readonly [TypeId]: HoldSubject.Variance<E, A>[TypeId] = this[Subject.TypeId]

    constructor(readonly value: MutableRef<Option<A>>) {
      super(never, value)
    }

    readonly get = Effect.sync(() => this.value.get())
  }
}
