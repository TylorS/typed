import { identity } from '@fp-ts/data/Function'
import { Disposable } from '@typed/disposable'

import type { Effect } from '../effect/Effect.js'

export interface Future<R, E, A> extends Future.Variance<R, E, A> {
  readonly state: Future.State<R, E, A>
  readonly addObserver: (observer: Future.Observer<R, E, A>) => Disposable
  readonly complete: (effect: Effect<R, E, A>) => boolean
}

export namespace Future {
  export const TypeId = Symbol('@typed/io/Future')
  export type TypeId = typeof TypeId

  export interface Variance<R, E, A> {
    readonly [TypeId]: {
      readonly _R: (_: never) => R
      readonly _E: (_: never) => E
      readonly _A: (_: never) => A
    }
  }

  export const Variance: Variance<any, any, any>[TypeId] = {
    _R: identity,
    _E: identity,
    _A: identity,
  }

  export interface Observer<R, E, A> {
    (effect: Effect<R, E, A>): void
  }

  export type State<R, E, A> = State.Pending | State.Resolved<R, E, A>

  export namespace State {
    export interface Pending {
      readonly _tag: 'Pending'
    }

    export interface Resolved<R, E, A> {
      readonly _tag: 'Resolved'
      readonly effect: Effect<R, E, A>
    }
  }

  export interface Pending<R, E, A> extends Future<R, E, A> {
    readonly state: State.Pending
  }

  export interface Resolved<R, E, A> extends Future<R, E, A> {
    readonly state: State.Resolved<R, E, A>
    readonly addObserver: (observer: Future.Observer<R, E, A>) => typeof Disposable.unit
    readonly complete: (effect: Effect<R, E, A>) => false
  }
}

export function isFuture<R, E, A>(v: unknown): v is Future<R, E, A> {
  return typeof v === 'object' && v != null && Future.TypeId in v
}

export function isPending<R, E, A>(future: Future<R, E, A>): future is Future.Pending<R, E, A> {
  return future.state._tag === 'Pending'
}

export function isResolved<R, E, A>(future: Future<R, E, A>): future is Future.Resolved<R, E, A> {
  return future.state._tag === 'Resolved'
}

export function pending<R, E, A>(): Future<R, E, A> {
  let state: Future.State<R, E, A> = { _tag: 'Pending' }
  const observers: Future.Observer<R, E, A>[] = []

  return {
    [Future.TypeId]: Future.Variance,
    get state() {
      return state
    },
    addObserver: (observer) => {
      if (state._tag === 'Resolved') {
        observer(state.effect)

        return Disposable.unit
      }

      observers.push(observer)

      return Disposable(() => {
        const index = observers.indexOf(observer)

        if (index > -1) {
          observers.splice(index, 1)
        }
      })
    },
    complete: (effect) => {
      if (state._tag === 'Resolved') {
        return false
      }

      state = { _tag: 'Resolved', effect }

      observers.forEach((o) => o(effect))
      observers.length = 0

      return true
    },
  }
}
