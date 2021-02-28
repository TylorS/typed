import { disposeNone } from '@most/disposable'
import { Disposable } from '@most/types'
import { Pure } from '@typed/fp/Fx'
import { run } from '@typed/fp/Resume'
import { pipe } from 'fp-ts/dist/function'

import { toEnv } from './Eff'

export function runPure<A>(onValue: (value: A) => Disposable) {
  return (pure: Pure<A>): Disposable => pipe(null, Object.create, toEnv(pure), run(onValue))
}

export const execPure = runPure(disposeNone)
