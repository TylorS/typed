import { pipe } from 'fp-ts/function'

import { complete, pending, wait } from '@/Future'
import { Fx, of } from '@/Fx'
import { EventElement } from '@/Sink'

import { drain } from './drain'
import { Stream } from './Stream'
import { tap, tapEnd, tapEvent } from './tap'

export const collectEventElements = <R, E, A>(
  stream: Stream<R, E, A>,
): Fx<R, E, readonly EventElement<A>[]> =>
  Fx(function* () {
    const events: EventElement<A>[] = []
    const future = pending<unknown, never, readonly EventElement<A>[]>()

    yield* pipe(
      stream,
      tapEvent((a) => events.push(a)),
      tapEnd(() => pipe(future, complete(of<readonly EventElement<A>[]>(events)))),
      drain,
    )

    const x = yield* wait(future)

    return x
  })

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
