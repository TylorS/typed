import { undisposable } from '@fp/Disposable/exports'
import { Task } from 'fp-ts/Task'

import { Pure } from './Effect'
import { runPure } from './runEffect'

/**
 * Converts a Pure<A> Effect into a Task<A>
 */
export const toTask = <A>(pure: Pure<A>): Task<A> => () => toPromise(pure)

/**
 * Converts a Pure<A> Effect into a Promise<A>
 */
export const toPromise = <A>(pure: Pure<A>): Promise<A> =>
  new Promise((resolve) => runPure(undisposable(resolve), pure))
