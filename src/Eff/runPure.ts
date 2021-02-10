import { toEnv } from '@fp/Eff'
import { Pure } from '@fp/Fx'
import { run } from '@fp/Resume'
import { disposeNone } from '@most/disposable'
import { Disposable } from '@most/types'
import { pipe } from 'fp-ts/dist/function'

export function runPure<A>(onValue: (value: A) => Disposable) {
  return (pure: Pure<A>): Disposable => pipe(null, Object.create, toEnv(pure), run(onValue))
}

export const execPure = runPure(disposeNone)
