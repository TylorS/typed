import { identity } from '@fp-ts/data/Function'

import { Fx, Sink } from '../Fx.js'
import { never } from '../constructor/never.js'
import { MulticastFx } from '../operator/multicast.js'

export interface Subject<E, A> extends Fx<never, E, A>, Sink<never, E, A>, Subject.Variance<E, A> {}

export namespace Subject {
  export const TypeId = Symbol.for('@typed/fx/Subject')
  export type TypeId = typeof TypeId

  export abstract class Variance<E, A> extends Fx.Variance<never, E, A> {
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

  export function unsafeMake<E, A>(): Subject<E, A> {
    return new SubjectImpl()
  }

  class SubjectImpl<E, A> extends MulticastFx<never, E, A> implements Subject<E, A> {
    readonly [TypeId]: Subject.Variance<E, A>[TypeId] = {
      _E: identity,
      _A: identity,
    }

    constructor() {
      super(never)
    }
  }
}
