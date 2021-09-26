import { Cancelable } from '@/Cancelable'
import { Cause } from '@/Cause'
import { Time } from '@/Clock'

export interface Stream<R, E, A> {
  readonly run: (requirements: R, sink: Sink<E, A>) => Cancelable
}

export interface Sink<E, A> {
  readonly event: (time: Time, value: A) => void
  readonly error: (time: Time, error: Cause<E>) => void
  readonly end: (time: Time) => void
}
