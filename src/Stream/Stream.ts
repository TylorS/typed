import { identity, pipe } from 'fp-ts/function'
import { isSome, match, none, Option, some } from 'fp-ts/Option'
import { ReadonlyNonEmptyArray } from 'fp-ts/ReadonlyNonEmptyArray'

import { prettyPrint, prettyStringify } from '@/Cause'
import { Time } from '@/Clock'
import { Context } from '@/Context'
import { Disposable } from '@/Disposable'
import { Scope } from '@/Scope'
import { EndElement, ErrorElement, EventElement, Sink, SinkTraceElement } from '@/Sink'
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
  scope: Scope<E, void>,
  tracer: Tracer<E>,
) => Disposable

/**
 * Helps deal with adding traces to your events
 */
export const make = <R, E, A>(
  run: (resources: R, sink: Sink<E, A>, context: Context<E>, scope: Scope<E, void>) => Disposable,
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
    ),
})

export interface Tracer<E> {
  readonly makeTrace: {
    <A>(event: EventElement<A>): EventElement<A>
    <E>(event: ErrorElement<E>): ErrorElement<E>
    (event: EndElement): EndElement
    <A>(event: SinkTraceElement<E, A>): SinkTraceElement<E, A>
  }
}

export function makeTracer<E>(
  context: Context<E>,
  shouldTrace = true,
  parentTrace: Option<Trace> = none,
): Tracer<E> {
  if (!shouldTrace) {
    return { makeTrace: identity }
  }

  return {
    makeTrace: (<A>(event: SinkTraceElement<E, A>) => {
      switch (event.type) {
        case 'Event':
          return { ...event, trace: some(makeEventTrace(context, event, parentTrace)) }
        case 'Error':
          return { ...event, trace: some(makeErrorTrace(context, event, parentTrace)) }
        case 'End':
          return { ...event, trace: some(makeEndTrace(context, event, parentTrace)) }
      }
    }) as Tracer<E>['makeTrace'],
  }
}

export function makeEventTrace<E, A>(
  context: Context<E>,
  event: EventElement<A>,
  parentTrace: Option<Trace> = none,
): Trace {
  return new Trace(
    context.fiberId,
    [
      new SourceLocation(
        `${event.operator} Event (${prettyTime(event.time)}) :: ${prettyStringify(event.value, 2)}`,
      ),
    ],
    concatAncsestor(parentTrace, event.trace),
  )
}

export function makeErrorTrace<E>(
  context: Context<E>,
  event: ErrorElement<E>,
  parentTrace: Option<Trace> = none,
): Trace {
  return new Trace(
    context.fiberId,
    [
      new SourceLocation(
        `${event.operator} Error (${prettyTime(event.time)}) :: ${prettyPrint(
          event.cause,
          context.renderer,
        ).replace(/\n/g, '\n  ')}`,
      ),
    ],
    parentTrace,
  )
}

export function makeEndTrace<E>(
  context: Context<E>,
  event: EndElement,
  parentTrace: Option<Trace> = none,
): Trace {
  return new Trace(
    context.fiberId,
    [new SourceLocation(`${event.operator} End (${prettyTime(event.time)})`)],
    concatAncsestor(parentTrace, event.trace),
  )
}

function prettyTime(time: Time) {
  return new Date(time).toISOString()
}

function concatAncsestor(parentTrace: Option<Trace>, childTrace: Option<Trace>): Option<Trace> {
  return pipe(
    parentTrace,
    match(
      () => childTrace,
      (parent) =>
        pipe(
          childTrace,
          match(
            () => parent,
            (t) => prependAncestor(t, parent),
          ),
          some,
        ),
    ),
  )
}

function prependAncestor(trace: Trace, anscestor: Trace): Trace {
  return listToTrace(traceToList(trace, anscestor))
}

function traceToList(trace: Trace, ancestor: Trace): ReadonlyNonEmptyArray<Trace> {
  const traces: [Trace, ...Trace[]] = [{ ...trace, parentTrace: none }]

  let current = trace

  while (isSome(current.parentTrace)) {
    const trace = current.parentTrace.value

    traces.push({ ...trace, parentTrace: none })

    current = trace
  }

  traces.push(ancestor)

  return traces
}

function listToTrace(traces: ReadonlyNonEmptyArray<Trace>): Trace {
  return traces.reduceRight((parentTrace, trace) => ({
    ...trace,
    parentTrace: some(parentTrace),
  }))
}
