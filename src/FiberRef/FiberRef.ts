import { DeepEquals, Eq } from '@/Eq'
import { Fx } from '@/Fx'
import { Magma, Second } from '@/Magma'
import { Option, Some } from '@/Option'

export class FiberRef<R, E, A> {
  constructor(
    readonly initial: Fx<R, E, A>,
    readonly Eq: Eq<A> = DeepEquals,
    readonly Magma: Magma<A> = Second,
    readonly fork: (a: A) => Option<A> = Some,
  ) {}

  static make = <R, E, A>(initial: Fx<R, E, A>, options: FiberRefOptions<A> = {}) =>
    new FiberRef(initial, options.Eq, options.Magma, options.fork)
}

export const make = FiberRef.make

export interface FiberRefOptions<A> {
  readonly Eq?: Eq<A>
  readonly Magma?: Magma<A>
  readonly fork?: (a: A) => Option<A>
}
