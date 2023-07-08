import * as MutableRef from '@effect/data/MutableRef'

import type { Effect } from './Effect.js'
import { Async } from './Instruction.js'

export interface Deferred<R, E, A> {
  readonly state: MutableRef.MutableRef<Deferred.State<R, E, A>>
}

export namespace Deferred {
  export type State<R, E, A> = Done<R, E, A> | Waiting<R, E, A>

  export class Done<R, E, A> {
    readonly _tag = 'Done' as const

    constructor(readonly effect: Effect<R, E, A>) {}
  }

  export class Waiting<R, E, A> {
    readonly _tag = 'Waiting' as const

    constructor(readonly waiters: Array<(effect: Effect<R, E, A>) => void>) {}
  }
}

export function makeDeferred<R, E, A>(): Deferred<R, E, A> {
  return {
    state: MutableRef.make(new Deferred.Waiting([])),
  }
}

export function wait<R, E, A>(deferred: Deferred<R, E, A>): Effect<R, E, A> {
  return new Async<R, E, A>((cb) => {
    const state = MutableRef.get(deferred.state)

    if (state._tag === 'Waiting') {
      MutableRef.set(deferred.state, new Deferred.Waiting([...state.waiters, cb]))
    } else {
      cb(state.effect)
    }

    return {
      dispose: () => {
        const state = MutableRef.get(deferred.state)

        if (state._tag === 'Waiting') {
          MutableRef.set(
            deferred.state,
            new Deferred.Waiting(state.waiters.filter((w) => w !== cb)),
          )
        }
      },
    }
  })
}

export function complete<R, E, A>(deferred: Deferred<R, E, A>, exit: Effect<R, E, A>) {
  const state = MutableRef.get(deferred.state)

  if (state._tag === 'Waiting') {
    for (const waiter of state.waiters) {
      waiter(exit)
    }

    const next = new Deferred.Done(exit)

    MutableRef.set(deferred.state, next)

    return next
  }

  return state
}
