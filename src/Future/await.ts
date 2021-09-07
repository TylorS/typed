import { pipe } from 'fp-ts/lib/function'

import { fromCbRight } from '@/Async'
import { disposeNone } from '@/Disposable'
import { chain, fromAsync, Fx } from '@/Fx'

import { Future } from './Future'

function _await<R, E, A>(future: Future<R, E, A>): Fx<R, E, A> {
  const state = future.state.get

  switch (state._tag) {
    case 'Done':
      return state.fx
    case 'Pending':
      return pipe(
        fromCbRight<Fx<R, E, A>>((cb) => {
          const state = future.state.get

          if (state._tag === 'Done') {
            cb(state.fx)

            return disposeNone()
          }

          state.listeners.add(cb)

          return {
            dispose: () => {
              state.listeners.delete(cb)
            },
          }
        }),
        fromAsync,
        chain((x) => x),
      )
  }
}

export { _await as await }
