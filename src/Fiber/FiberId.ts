import { Branded } from '@fp/Branded'

export type FiberId = Branded<{ readonly FiberId: unique symbol }, PropertyKey>
export const FiberId = Branded<FiberId>()
