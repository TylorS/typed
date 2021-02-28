import { Env, map } from '@typed/fp/Env'
import { EnvEither } from '@typed/fp/EnvEither'
import { left, right } from 'fp-ts/dist/Either'
import { pipe } from 'fp-ts/dist/function'

import { catchError } from './catchError'
import { FailEnv } from './FailEnv'

export const attempt = <Name extends PropertyKey>(name: Name) => <E>() => {
  const catchByName = catchError(name)

  return <R, A>(env: Env<R & FailEnv<Name, E>, A>): EnvEither<R, E, A> => {
    return pipe(
      env,
      map(right),
      catchByName((e: E) => left<E, A>(e)),
    )
  }
}
