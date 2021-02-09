import { doFx } from './doFx'
import { Fx } from './Fx'

export interface Pure<A> extends Fx<never, A> {}

export const pure = <A>(value: A): Pure<A> =>
  // eslint-disable-next-line require-yield
  doFx(function* () {
    return value
  })
