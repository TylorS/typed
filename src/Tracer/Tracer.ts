import { isSome, some } from 'fp-ts/Option'

import {
  EndElement,
  ErrorElement,
  EventElement,
  formatEndElement,
  formatErrorElement,
  formatEventElement,
} from '@/Sink'
import { Trace, traceLocation } from '@/Trace'

export class Tracer<A> {
  readonly event = (event: EventElement<A>): Trace =>
    new Trace(event.fiberId, [traceLocation(formatEventElement(event))], event.trace)
  readonly error = (event: ErrorElement<A>): Trace =>
    new Trace(event.fiberId, [traceLocation(formatErrorElement(event))], event.trace)
  readonly end = (event: EndElement): Trace =>
    new Trace(event.fiberId, [traceLocation(formatEndElement(event))], event.trace)

  readonly prependParentTrace = (parent: Trace, child: Trace): Trace => {
    const children = [child]
    let current = child

    while (isSome(current.parentTrace)) {
      current = current.parentTrace.value
      children.push(current)
    }

    const { fiberId, executionTrace } = children.pop()!

    current = new Trace(fiberId, executionTrace, some(parent))

    while (children.length > 0) {
      const last = children.pop()!
      current = new Trace(last.fiberId, last.executionTrace, some(current))
    }

    return current
  }
}
