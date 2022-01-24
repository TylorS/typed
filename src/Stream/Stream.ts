import { identity, pipe } from 'fp-ts/function'
import { none, Option, some } from 'fp-ts/Option'

import { addParentTrace } from '@/Cause'
import { Context } from '@/Context'
import { Disposable } from '@/Disposable'
import { FiberId } from '@/FiberId'
import { LocalScope } from '@/Scope'
import {
  EndElement,
  ErrorElement,
  EventElement,
  formatEndElement,
  formatErrorElement,
  formatEventElement,
  Sink,
  SinkTraceElement,
} from '@/Sink'
import { SourceLocation, Trace } from '@/Trace'

export interface Stream<R, E, A> {
  readonly run: StreamRun<R, E, A>
}

export interface RStream<R, A> extends Stream<R, never, A> {}
export interface EStream<E, A> extends Stream<unknown, E, A> {}
export interface Of<A> extends Stream<unknown, never, A> {}

export type StreamRun<R, E, A> = (
  resources: R,
  sink: Sink<E, A>,
  context: Context<E>,
  scope: LocalScope<E, void>,
  tracer: Tracer<E>,
) => Disposable

/**
 * Helps deal with adding traces to your events
 */
export const make = <R, E, A>(
  run: (
    resources: R,
    sink: Sink<E, A>,
    context: Context<E>,
    scope: LocalScope<E, void>,
    tracer: Tracer<E>,
  ) => Disposable,
): Stream<R, E, A> => ({
  run: (resources, sink, context, scope, tracer) =>
    run(
      resources,
      {
        event: (event) => sink.event(tracer.makeTrace(event)),
        error: (event) => sink.error(tracer.makeTrace(event)),
        end: (event) => sink.end(tracer.makeTrace(event)),
      },
      context,
      scope,
      tracer,
    ),
})

export interface Tracer<E> {
  readonly shouldTrace: boolean
  readonly makeTrace: {
    <A>(event: EventElement<A>): EventElement<A>
    <E>(event: ErrorElement<E>): ErrorElement<E>
    (event: EndElement): EndElement
    <A>(event: SinkTraceElement<E, A>): SinkTraceElement<E, A>
  }
}

export function makeTracer<E>(
  context: Context<E>,
  shouldTrace = false,
  parentTrace: Option<Trace> = none,
): Tracer<E> {
  if (!shouldTrace) {
    return { makeTrace: identity, shouldTrace }
  }

  return {
    shouldTrace,
    makeTrace: (<A>(event: SinkTraceElement<E, A>) => {
      switch (event.type) {
        case 'Event':
          return {
            ...event,
            trace: some(makeEventTrace(context.fiberId, formatEventElement(event), parentTrace)),
          }
        case 'Error':
          return {
            ...event,
            trace: some(makeEventTrace(context.fiberId, formatErrorElement(event), parentTrace)),
          }
        case 'End':
          return {
            ...event,
            trace: some(makeEventTrace(context.fiberId, formatEndElement(event), parentTrace)),
          }
      }
    }) as Tracer<E>['makeTrace'],
  }
}

export function addOperator(operator: string) {
  return <E>(tracer: Tracer<E>): Tracer<E> => {
    if (!tracer.shouldTrace) {
      return tracer
    }

    return {
      shouldTrace: true,
      makeTrace: (<A>(event: SinkTraceElement<E, A>): SinkTraceElement<E, A> => {
        const current = tracer.makeTrace(event)

        switch (current.type) {
          case 'Event':
            return {
              ...current,
              trace: some(makeEventTrace(current.fiberId, operator, current.trace)),
            }
          case 'Error':
            return {
              ...current,
              cause: pipe(
                current.cause,
                addParentTrace(some(makeEventTrace(current.fiberId, operator))),
              ),
            }
          case 'End':
            return { ...current, trace: some(makeEventTrace(current.fiberId, operator)) }
        }
      }) as Tracer<E>['makeTrace'],
    }
  }
}

export function makeEventTrace(
  fiberId: FiberId,
  trace: string,
  parentTrace: Option<Trace> = none,
): Trace {
  return new Trace(fiberId, [new SourceLocation(trace)], parentTrace)
}
