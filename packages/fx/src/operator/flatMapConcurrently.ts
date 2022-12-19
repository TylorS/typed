import * as TSemaphore from '@effect/stm/TSemaphore'
import { flow, pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'
import { suspend } from '../constructor/suspend.js'

import { flatMap } from './flatMap.js'
import { withPermit } from './withPermit.js'

export function flatMapConcurrently<A, R2, E2, B>(concurrency: number, f: (a: A) => Fx<R2, E2, B>) {
  return <R, E>(stream: Fx<R, E, A>): Fx<R | R2, E | E2, B> =>
    suspend(() => {
      const semaphore = TSemaphore.unsafeMake(concurrency)

      return pipe(stream, flatMap(flow(f, withPermit(semaphore))))
    })
}
