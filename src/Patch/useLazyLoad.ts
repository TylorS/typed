import { chain, doEffect, Effect, fromTask, map, Pure } from '@typed/fp/Effect/exports'
import { SchedulerEnv } from '@typed/fp/Scheduler/exports'
import { SharedEnv, useEffect, useState } from '@typed/fp/Shared/exports'
import { pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Task } from 'fp-ts/Task'

/**
 * A hook function for lazy loading a module using dynamic imports.
 * @example
 * function* runModule(m: typeof import('./myView')) {
 *  const data = yield* getMyData()
 *
 *  return m.myView(data)
 * }
 *
 * const lazyLoadedView = doEffect(function*() {
 *  const html = yield* useLazyLoad(() => import('./myView'), m => doEffect(() => runModule(m)), constant(loadingView))
 *
 *  return html
 * })
 */
export const useLazyLoad = <A, E, B>(
  task: Task<A>,
  f: (value: A) => Effect<E, B>,
  fallback: IO<B>,
): Effect<E & SharedEnv & SchedulerEnv, B> => {
  const eff = doEffect(function* () {
    const [getState, setState] = yield* useState(Pure.fromIO(fallback))

    yield* useEffect(pipe(task, fromTask, chain(f), map(setState)), [task])

    return getState()
  })

  return eff
}
