import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'

import { addParentTrace, Cause, prettyPrint, prettyStringify, Unexpected } from '@/Cause'
import { Time } from '@/Clock'
import { FiberId } from '@/FiberId'
import { prettyTrace, SourceLocation, Trace } from '@/Trace'

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
      fiberId: event.fiberId,
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
      fiberId: event.fiberId,
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
  readonly fiberId: FiberId
}

export interface ErrorElement<E> {
  readonly type: 'Error'
  readonly time: Time
  readonly operator: string
  readonly cause: Cause<E>
  readonly fiberId: FiberId
}

export interface EndElement {
  readonly type: 'End'
  readonly time: Time
  readonly operator: string
  readonly trace: Option<Trace>
  readonly fiberId: FiberId
}

export function formatSinkTraceElement<E, A>(element: SinkTraceElement<E, A>): string {
  switch (element.type) {
    case 'Event':
      return formatEventElement(element)
    case 'Error':
      return formatErrorElement(element)
    case 'End':
      return formatEndElement(element)
  }
}

export function formatEventElement<A>(element: EventElement<A>): string {
  const formatted = `${element.operator} Event (${new Date(
    element.time,
  ).toISOString()}): ${prettyStringify(element.value)}`

  return prettyTrace(new Trace(element.fiberId, [new SourceLocation(formatted)], element.trace))
}

export function formatErrorElement<E>(element: ErrorElement<E>): string {
  return `${element.operator} Error (${new Date(element.time).toLocaleDateString()}): ${prettyPrint(
    element.cause,
  )}`
}

export function formatEndElement(element: EndElement): string {
  const formatted = `${element.operator} End (${new Date(element.time).toLocaleDateString()})`

  return prettyTrace(new Trace(element.fiberId, [new SourceLocation(formatted)], element.trace))
}
