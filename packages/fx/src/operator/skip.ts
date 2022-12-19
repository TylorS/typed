import { Fx } from '../Fx.js'

import { slice } from './slice.js'

export const skip: (amount: number) => <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = (amount) =>
  slice(amount, Infinity)
