import { Env, map } from '@fp/Env'
import { EnvEither } from '@fp/EnvEither'
import { left, right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

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
