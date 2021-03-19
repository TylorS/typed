import { disposeNone } from '@most/disposable'
import { Disposable } from '@most/types'
import { run } from '@typed/fp/Resume'
import { pipe } from 'fp-ts/dist/function'

import { Env } from './Env'

export function runPure<A>(onValue: (value: A) => Disposable) {
  return (pure: Env<never, A>): Disposable => pipe(Object.create(null) as never, pure, run(onValue))
}

export const execPure = runPure(disposeNone)
