import { undisposable } from '@typed/fp/Disposable/exports'
import { Task } from 'fp-ts/Task'

import { Pure } from './Effect'
import { runPure } from './runEffect'

export const toTask = <A>(pure: Pure<A>): Task<A> => () => toPromise(pure)

export const toPromise = <A>(pure: Pure<A>): Promise<A> =>
  new Promise((resolve) => runPure(undisposable(resolve), pure))
