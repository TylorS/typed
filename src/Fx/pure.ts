import { doFx } from './doFx'
import { PureFx } from './Fx'

/**
 * Create an PureFx containing a value
 */
export const pure = <A>(value: A): PureFx<A> =>
  // eslint-disable-next-line require-yield
  doFx(function* () {
    return value
  })
