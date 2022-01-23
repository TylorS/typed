import { Fx } from '@/Fx'

import { Future } from './Future'

export function complete<R, E, A>(fx: Fx<R, E, A>) {
  return (future: Future<R, E, A>): Future<R, E, A> => {
    const state = future.state.get()

    switch (state.type) {
      case 'Done':
        return future
      case 'Pending': {
        future.state.set({ type: 'Done', fx })

        state.listeners.forEach((f) => f(fx))
        state.listeners.clear()

        return future
      }
    }
  }
}
