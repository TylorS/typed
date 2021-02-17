import { Disposable } from '@most/types'
import { run } from '@typed/fp/Resume'
import { match } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import { EffEither, toEnvEither } from './EffEither'

export function fork<E, A>(onLeft: (e: E) => Disposable, onRight: (value: A) => Disposable) {
  return (effEither: EffEither<never, E, A>): Disposable =>
    pipe(toEnvEither(effEither)({} as never), run(match(onLeft, onRight)))
}
