import { IO } from 'fp-ts/IO'

import { doFx } from './doFx'
import { PureFx } from './Fx'

/**
 * Creates a PureFx from an IO
 */
export const fromIO = <A>(io: IO<A>): PureFx<A> =>
  // eslint-disable-next-line require-yield
  doFx(function* () {
    return io()
  })
