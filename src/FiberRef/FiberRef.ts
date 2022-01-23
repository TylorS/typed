import { Eq } from 'fp-ts/Eq'
import { Magma } from 'fp-ts/Magma'
import { Option, some } from 'fp-ts/Option'

import { DeepEquals } from '@/Eq'
import { Fx } from '@/Fx'
import { Second } from '@/Magma'

export class FiberRef<R, E, A> {
  constructor(
    readonly initial: Fx<R, E, A>,
    readonly Eq: Eq<A> = DeepEquals,
    readonly Magma: Magma<A> = Second,
    readonly fork: (a: A) => Option<A> = some,
  ) {}

  static make = <R, E, A>(initial: Fx<R, E, A>, options: FiberRefOptions<A> = {}) =>
    new FiberRef(initial, options.Eq ?? DeepEquals, options.Magma ?? Second, options.fork ?? some)
}

export const make = FiberRef.make

export interface FiberRefOptions<A> {
  readonly Eq?: Eq<A>
  readonly Magma?: Magma<A>
  readonly fork?: (a: A) => Option<A>
}
