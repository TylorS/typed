import { Eq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'

import { AtomicReference, getAndIncrement } from '@/AtomicReference'
import { Branded } from '@/Branded'

export interface FiberRef<A> extends Eq<A> {
  readonly id: FiberRefId
  readonly initial: A
}

export type FiberRefId = Branded<symbol, { readonly FiberRefId: unique symbol }>
export const FiberRefId = Branded<FiberRefId>()

const counter = new AtomicReference(0)

export function unsafeFiberRefId(): FiberRefId {
  return pipe(counter, getAndIncrement, Symbol, FiberRefId)
}

export function unsafeMakeFiberRef<A>(initial: A, equals: Eq<A>['equals']): FiberRef<A> {
  return {
    id: unsafeFiberRefId(),
    initial,
    equals,
  }
}
