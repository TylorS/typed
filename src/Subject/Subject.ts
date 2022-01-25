import { none, some } from 'fp-ts/Option'

import { Cause } from '@/Cause'
import { Context } from '@/Context'
import { sync } from '@/Disposable'
import { LocalScope } from '@/Scope'
import { Sink, tryEnd, tryEvent } from '@/Sink'
import * as Stream from '@/Stream'
import { Tracer } from '@/Stream'
import { SourceLocation, Trace } from '@/Trace'

export class Subject<R, E, A> implements SubjectSink<E, A>, Stream.Stream<R, E, A> {
  protected observers: Set<Stream.MulticastObserver<R, E, A>> = new Set()

  constructor(readonly name: string = 'Subject') {}

  readonly event = (a: A): void => {
    Array.from(this.observers).forEach((o) =>
      tryEvent(o.sink, {
        fiberId: o.context.fiberId,
        type: 'Event',
        operator: this.name,
        time: o.context.scheduler.getCurrentTime(),
        value: a,
        trace: some(new Trace(o.context.fiberId, [new SourceLocation(this.name)], none)),
      }),
    )
  }

  readonly error = (cause: Cause<E>): void => {
    Array.from(this.observers).forEach((o) =>
      o.sink.error(
        o.tracer.makeTrace({
          fiberId: o.context.fiberId,
          type: 'Error',
          operator: this.name,
          time: o.context.scheduler.getCurrentTime(),
          cause,
        }),
      ),
    )
  }

  readonly end = (): void => {
    Array.from(this.observers).forEach((o) =>
      tryEnd(o.sink, {
        fiberId: o.context.fiberId,
        type: 'End',
        operator: this.name,
        time: o.context.scheduler.getCurrentTime(),
        trace: none,
      }),
    )
  }

  readonly sink: SubjectSink<E, A> = {
    event: this.event,
    error: this.error,
    end: this.end,
  }

  readonly run = (
    resources: R,
    sink: Sink<E, A>,
    context: Context<E>,
    scope: LocalScope<E, any>,
    tracer: Tracer<E>,
  ) => {
    const observer: Stream.MulticastObserver<R, E, A> = { resources, sink, context, scope, tracer }

    this.observers.add(observer)

    return sync(() => this.observers.delete(observer))
  }
}

export interface SubjectSink<E, A> {
  readonly event: (value: A) => void
  readonly error: (cause: Cause<E>) => void
  readonly end: () => void
}
