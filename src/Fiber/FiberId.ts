import { Branded } from '../Branded'

export type FiberId = Branded<{ readonly FiberId: unique symbol }, PropertyKey>
export const FiberId = Branded<FiberId>()
