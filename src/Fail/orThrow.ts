import { chain, Env, of } from '@typed/fp/Env'
import { EnvEither } from '@typed/fp/EnvEither'
import { isLeft } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import { FailEnv } from './FailEnv'
import { throwError } from './throwError'

export const orThrow = <Name extends PropertyKey>(name: Name) => {
  const fail = throwError(name)

  return <R, E, A>(env: EnvEither<R, E, A>): Env<R & FailEnv<Name, E>, A> =>
    pipe(
      env,
      chain((either) => {
        if (isLeft(either)) {
          return fail(either.left)
        }

        return of(either.right)
      }),
    ) as Env<R & FailEnv<Name, E>, A>
}
