import { IO } from 'fp-ts/dist/IO'

import { doFx } from './doFx'
import { Fx } from './Fx'

/**
 * An Fx which has no Effects or they have all been accounted for.
 */
export interface Pure<A> extends Fx<never, A> {}

export const pure = <A>(value: A): Pure<A> =>
  // eslint-disable-next-line require-yield
  doFx(function* () {
    return value
  })

export const fromIO = <A>(io: IO<A>): Pure<A> =>
  // eslint-disable-next-line require-yield
  doFx(function* () {
    return io()
  })
