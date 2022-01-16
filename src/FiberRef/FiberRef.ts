import { Eq } from 'fp-ts/Eq'
import { Magma } from 'fp-ts/Magma'
import { Option, some } from 'fp-ts/Option'

import { Branded } from '@/Branded'
import { Effect } from '@/Effect'
import { DeepEquals } from '@/Eq'
import { Second } from '@/Magma'

export class FiberRef<R, E, A> {
  constructor(
    readonly id: FiberRefId,
    readonly initial: Effect<R, E, A>,
    readonly Eq: Eq<A> = DeepEquals,
    readonly Magma: Magma<A> = Second,
    readonly fork: (a: A) => Option<A> = some,
  ) {}

  static make = <R, E, A>(
    id: PropertyKey,
    initial: Effect<R, E, A>,
    options: FiberRefOptions<A> = {},
  ) =>
    new FiberRef(
      FiberRefId(typeof id === 'symbol' ? id : Symbol(`${id}`)),
      initial,
      options.Eq ?? DeepEquals,
      options.Magma ?? Second,
      options.fork ?? some,
    )
}

export interface FiberRefOptions<A> {
  readonly Eq?: Eq<A>
  readonly Magma?: Magma<A>
  readonly fork?: (a: A) => Option<A>
}

export type FiberRefId = Branded<PropertyKey, 'FiberRefId'>
export const FiberRefId = Branded<FiberRefId>()
