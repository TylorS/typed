import { pipe } from 'fp-ts/function'

import { complete, pending, wait } from '@/Future'
import { Fx, of } from '@/Fx'

import { drain } from './drain'
import { Stream } from './Stream'
import { tap, tapEnd } from './tap'

export const collectEvents = <R, E, A>(stream: Stream<R, E, A>): Fx<R, E, readonly A[]> =>
  Fx(function* () {
    const events: A[] = []
    const future = pending<unknown, never, readonly A[]>()

    yield* pipe(
      stream,
      tap((a) => events.push(a)),
      tapEnd(() => pipe(future, complete(of<readonly A[]>(events)))),
      drain,
    )

    const x = yield* wait(future)

    return x
  })
