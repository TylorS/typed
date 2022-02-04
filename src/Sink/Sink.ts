import { pipe } from 'fp-ts/function'
import { match, Option } from 'fp-ts/Option'

import * as Cause from '@/Cause'
import { Time } from '@/Clock'
import { FiberId } from '@/FiberId'
import { prettyTrace, Trace } from '@/Trace'

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
      cause: Cause.Unexpected(e),
      fiberId: event.fiberId,
      trace: event.trace,
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
      cause: Cause.Unexpected(e),
      fiberId: event.fiberId,
      trace: event.trace,
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
  readonly cause: Cause.Cause<E>
  readonly trace: Option<Trace>
  readonly fiberId: FiberId
}

export interface EndElement {
  readonly type: 'End'
  readonly time: Time
  readonly operator: string
  readonly trace: Option<Trace>
  readonly fiberId: FiberId
}

export function prettyPrint<E, A>(element: SinkTraceElement<E, A>, prepend = '  '): string {
  return pipe(
    element.trace,
    match(
      () => formatSinkTraceElement(element),
      (trace) => prettyTrace(trace).replace(/\n/g, '\n' + prepend),
    ),
  )
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
  return `Stream Event :: ${element.operator} (${element.time}): ${Cause.prettyStringify(
    element.value,
  )}`
}

export function formatErrorElement<E>(element: ErrorElement<E>): string {
  return `Stream Error :: ${element.operator} (${element.time}): ${Cause.prettyPrint(
    element.cause,
  )}`
}

export function formatEndElement(element: EndElement): string {
  return `Stream End :: ${element.operator} (${element.time})`
}
