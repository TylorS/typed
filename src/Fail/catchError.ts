import { Env } from '@fp/Env'
import { async, run } from '@fp/Resume'
import { pipe } from 'fp-ts/function'

import { keyValue } from './_internal'
import { FailEnv } from './FailEnv'

/**
 * Remove a FailEnv requirement from the environment
 */
export const catchError = <Name extends PropertyKey>(name: Name) => <E, A>(
  onError: (error: E) => A,
) => <R, B>(eff: Env<R & FailEnv<Name, E>, B>): Env<R, A | B> => (r) =>
  async<A | B>((resume) =>
    pipe(
      {
        ...r,
        ...keyValue(name, (e: E) => async<never>(() => pipe(e, onError, resume))),
      },
      eff,
      run(resume),
    ),
  )
