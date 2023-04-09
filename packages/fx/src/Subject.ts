import { methodWithTrace } from '@effect/data/Debug'

import type { Fx, Sink } from './Fx.js'

import { Effect, Fiber } from '@typed/fx/externals'
import { HoldFx } from '@typed/fx/hold'
import { MulticastFx } from '@typed/fx/multicast'
import { never } from '@typed/fx/never'

export interface Subject<E, A> extends Fx<never, E, A>, Sink<never, E, A> {
  readonly end: () => Effect.Effect<never, never, void>
}

export function makeSubject<E, A>(): Subject<E, A> {
  return new SubjectImpl<E, A>()
}

export function makeHoldSubject<E, A>(): Subject<E, A> {
  return new HoldSubjectImpl<E, A>()
}

export class SubjectImpl<E, A> extends MulticastFx<never, E, A> implements Subject<E, A> {
  constructor() {
    super(never<E, A>())
  }

  readonly end = methodWithTrace(
    (trace) => () =>
      Effect.suspend(() => (this.fiber ? Fiber.interrupt(this.fiber) : Effect.unit())).traced(
        trace,
      ),
  )
}

export class HoldSubjectImpl<E, A> extends HoldFx<never, E, A> implements Subject<E, A> {
  constructor() {
    super(never<E, A>())
  }

  readonly end = methodWithTrace(
    (trace) => () =>
      Effect.suspend(() => (this.fiber ? Fiber.interrupt(this.fiber) : Effect.unit())).traced(
        trace,
      ),
  )
}
