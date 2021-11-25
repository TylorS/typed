import { Cause } from '@/Cause'
import { Time } from '@/Clock'
import { Context } from '@/Context'
import { Fiber } from '@/Fiber/Fiber'
import { Fx } from '@/Fx'
import { Scope } from '@/Scope/Scope'

export interface Stream<R, E, A> {
  readonly run: <R2, E2>(
    sink: Sink<R2, E2, A>,
    context: Context,
    scope: Scope<R, E | E2, void>,
  ) => Fiber<E | E2, void>
}

export interface Sink<R, E, A> {
  readonly event: (time: Time, value: A) => Fx<R, E, void>
  readonly error: (time: Time, cause: Cause<E>) => Fx<R, E, void>
  readonly end: (time: Time) => Fx<R, E, void>
}
