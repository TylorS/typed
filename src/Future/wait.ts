import { None, Sync } from '@/Disposable'
import { fromAsync } from '@/Effect'
import { Fx } from '@/Fx'
import { fromCallback } from '@/Prelude/Async'

import { Future } from './Future'

export function wait<R, E, A>(future: Future<R, E, A>, trace?: string): Fx<R, E, A> {
  const initialState = future.state.get()

  switch (initialState.type) {
    case 'Pending':
      return pendingWait(future, trace)
    case 'Done':
      return initialState.fx
  }
}

export function pendingWait<R, E, A>(future: Future<R, E, A>, trace?: string): Fx<R, E, A> {
  return Fx(function* () {
    const fx = yield* fromAsync(
      fromCallback<Fx<R, E, A>>((cb) => {
        const state = future.state.get()

        switch (state.type) {
          case 'Pending': {
            state.listeners.add(cb)

            return Sync(() => state.listeners.delete(cb))
          }
          case 'Done': {
            cb(state.fx)

            return None
          }
        }
      }),
      trace,
    )

    return yield* fx
  })
}
