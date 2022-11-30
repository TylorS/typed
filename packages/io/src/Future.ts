import { Disposable } from '@typed/disposable'

import { Effect, of, sync } from './Effect.js'

export interface Future<R, E, A> {
  readonly state: FutureState<R, E, A>
  readonly addObserver: (f: (effect: Effect<R, E, A>) => void) => Disposable
  readonly complete: (effect: Effect<R, E, A>) => Effect<never, never, boolean>
}

export interface ReadonlyFuture<R, E, A> extends Omit<Future<R, E, A>, 'complete'> {}

export type FutureState<R, E, A> = FuturePending | FutureResolved<R, E, A>

export interface FuturePending {
  readonly tag: 'Pending'
}

export interface FutureResolved<R, E, A> {
  readonly tag: 'Resolved'
  readonly effect: Effect<R, E, A>
}

export function pending<R, E, A>(): Future<R, E, A> {
  let state: FutureState<R, E, A> = { tag: 'Pending' }
  let observers: ((effect: Effect<R, E, A>) => void)[] = []

  const addObserver = (f: (effect: Effect<R, E, A>) => void): Disposable => {
    if (state.tag === 'Resolved') {
      f(state.effect)

      return Disposable.unit
    }

    observers.push(f)

    return Disposable(() => {
      const i = observers.indexOf(f)

      if (i > -1) {
        observers.splice(i, 1)
      }
    })
  }

  const complete = (effect: Effect<R, E, A>) => {
    if (state.tag === 'Resolved') {
      return false
    }

    state = { tag: 'Resolved', effect }
    observers.forEach((f) => f(effect))
    observers = []
    return true
  }

  return {
    get state() {
      return state
    },
    addObserver,
    complete: (eff) => sync(() => complete(eff)),
  }
}

export function resolved<R, E, A>(effect: Effect<R, E, A>): Future<R, E, A> {
  return {
    state: { tag: 'Resolved', effect },
    addObserver: (f) => (f(effect), Disposable.unit),
    complete: () => of(false),
  }
}
