import * as Cause from '@/Cause'
import { Time } from '@/Clock'
import { FiberId } from '@/FiberId'
import { prettyStringify } from '@/prettyStringify'

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
    })
  }
}

export type SinkTraceElement<E, A> = EventElement<A> | ErrorElement<E> | EndElement

export interface EventElement<A> {
  readonly type: 'Event'
  readonly time: Time
  readonly operator: string
  readonly value: A
  readonly fiberId: FiberId
}

export interface ErrorElement<E> {
  readonly type: 'Error'
  readonly time: Time
  readonly operator: string
  readonly cause: Cause.Cause<E>
  readonly fiberId: FiberId
}

export interface EndElement {
  readonly type: 'End'
  readonly time: Time
  readonly operator: string
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
  return `Event (Time: ${element.time}) :: ${element.operator} :: ${prettyStringify(element.value)}`
}

export function formatErrorElement<E>(element: ErrorElement<E>): string {
  return `Error (Time: ${element.time}) :: ${element.operator} :: ${Cause.prettyPrint(
    element.cause,
  )}`
}

export function formatEndElement(element: EndElement): string {
  return `End (Time: ${element.time}) :: ${element.operator}`
}
