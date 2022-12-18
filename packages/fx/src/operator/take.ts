import { Fx } from '../Fx.js'

import { slice } from './slice.js'

export const take: (amount: number) => <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = (
  amount: number,
) => slice(0, amount)
