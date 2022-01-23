import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'

import { addParentTrace, Cause, Unexpected } from '@/Cause'
import { Time } from '@/Clock'
import { Trace } from '@/Trace'

export interface Sink<E, A> {
  readonly event: (event: EventElement<A>) => void
  readonly error: (event: ErrorElement<E>) => void
  readonly end: (event: EndElement) => void
}

export function tryEvent<E, A>(sink: Sink<E, A>, event: EventElement<A>) {
  try {
    sink.event(event)
  } catch (e) {
    sink.error({
      type: 'Error',
      operator: event.operator,
      time: event.time,
      cause: pipe(Unexpected(e), addParentTrace(event.trace)) as Cause<E>,
    })
  }
}

export function tryEnd<E, A>(sink: Sink<E, A>, event: EndElement) {
  try {
    sink.end(event)
  } catch (e) {
    sink.error({
      type: 'Error',
      operator: event.operator,
      time: event.time,
      cause: pipe(Unexpected(e), addParentTrace(event.trace)) as Cause<E>,
    })
  }
}

export type SinkTraceElement<E, A> = EventElement<A> | ErrorElement<E> | EndElement

export interface EventElement<A> {
  readonly type: 'Event'
  readonly time: Time
  readonly operator: string
  readonly value: A
  readonly trace: Option<Trace>
}

export interface ErrorElement<E> {
  readonly type: 'Error'
  readonly time: Time
  readonly operator: string
  readonly cause: Cause<E>
}

export interface EndElement {
  readonly type: 'End'
  readonly time: Time
  readonly operator: string
  readonly trace: Option<Trace>
}
