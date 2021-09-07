import { pipe } from 'fp-ts/function'

import { AtomicReference, getAndIncrement } from '@/AtomicReference'
import { Branded } from '@/Branded'

export type FiberId = Branded<symbol, { readonly FiberId: unique symbol }>
export const FiberId = Branded<FiberId>()

const counter = new AtomicReference(0)

export function unsafeFiberId(): FiberId {
  return pipe(counter, getAndIncrement, Symbol, FiberId)
}
