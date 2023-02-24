import { flow, pipe } from '@effect/data/Function'
import { unsafeMakeSemaphore } from '@effect/io/Effect'

import type { Fx } from '../Fx.js'
import { suspend } from '../constructor/suspend.js'

import { flatMap } from './flatMap.js'
import { withPermit } from './withPermit.js'

export function flatMapConcurrently<A, R2, E2, B>(concurrency: number, f: (a: A) => Fx<R2, E2, B>) {
  return <R, E>(stream: Fx<R, E, A>): Fx<R | R2, E | E2, B> =>
    suspend(() => {
      const semaphore = unsafeMakeSemaphore(concurrency)

      return pipe(stream, flatMap(flow(f, withPermit(semaphore))))
    })
}
