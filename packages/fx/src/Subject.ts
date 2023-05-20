import { methodWithTrace } from '@effect/data/Debug'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'

import type { Fx, Sink } from './Fx.js'
import { HoldFx } from './hold.js'
import { MulticastFx } from './multicast.js'
import { never } from './never.js'

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
