import { Env } from '@fp/Env'
import { EnvEither } from '@fp/EnvEither'
import { capitalize } from '@fp/string'

import { keyValue } from './_internal'
import { attempt } from './attempt'
import { catchError } from './catchError'
import { FailEnv } from './FailEnv'
import { orThrow } from './orThrow'
import { throwError } from './throwError'

export const errorByName = <Name extends string>(name: Name): ErrorByName<Name> => ({
  ...throwErrorByName(name),
  ...catchErrorByName(name),
  ...attemptByName(name),
  ...orThrowByName(name),
})

export type ErrorByName<Name extends string> = ThrowErrorByName<Name> &
  CatchErrorByName<Name> &
  AttemptByName<Name> &
  OrThrowByName<Name>

export type ThrowErrorByName<Name extends string> = {
  readonly [K in `throw${Capitalize<Name>}`]: <E>(error: E) => Env<FailEnv<Name, E>, never>
}

export type CatchErrorByName<Name extends string> = {
  readonly [K in `catch${Capitalize<Name>}`]: <E, A>(
    onError: (error: E) => A,
  ) => <R, B>(eff: Env<R & FailEnv<Name, E>, B>) => Env<R, A | B>
}

export type AttemptByName<Name extends string> = {
  readonly [K in `attempt${Capitalize<Name>}`]: <E>() => <R, A>(
    env: Env<R & FailEnv<Name, E>, A>,
  ) => EnvEither<R, E, A>
}

export type OrThrowByName<Name extends string> = {
  readonly [K in `orThrow${Capitalize<Name>}`]: <R, E, A>(
    env: EnvEither<R, E, A>,
  ) => Env<R & FailEnv<Name, E>, A>
}

const throwErrorByName = <Name extends string>(name: Name): ThrowErrorByName<Name> =>
  keyValue(`throw${capitalize(name)}` as `throw${Capitalize<Name>}`, throwError(name))

const catchErrorByName = <Name extends string>(name: Name): CatchErrorByName<Name> =>
  keyValue(`catch${capitalize(name)}` as `catch${Capitalize<Name>}`, catchError(name))

const attemptByName = <Name extends string>(name: Name): AttemptByName<Name> =>
  keyValue(`attempt${capitalize(name)}` as `attempt${Capitalize<Name>}`, attempt(name))

const orThrowByName = <Name extends string>(name: Name): OrThrowByName<Name> =>
  keyValue(`orThrow${capitalize(name)}` as `orThrow${Capitalize<Name>}`, orThrow(name))
