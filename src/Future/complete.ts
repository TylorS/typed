import { pipe } from 'fp-ts/function'

import * as AR from '@/AtomicReference'
import { fromIO, Fx, mapTo, Pure } from '@/Fx'

import { Future, FutureState } from './Future'

export function complete<R, E, A>(fx: Fx<R, E, A>) {
  return (future: Future<R, E, A>): Pure<Future<R, E, A>> =>
    pipe(
      future.state,
      AR.update((x) =>
        fromIO((): FutureState<R, E, A> => (x._tag === 'Done' ? x : { _tag: 'Done', fx })),
      ),
      mapTo(future),
    )
}
