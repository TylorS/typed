import { fromNullable } from 'fp-ts/Option'

import { Cause } from '@/Cause'
import { sync } from '@/Disposable'
import { Sink, tryEnd, tryEvent } from '@/Sink'
import * as Stream from '@/Stream'
import { StreamContext } from '@/Stream'
import { Trace } from '@/Trace'

export class Subject<R, E, A> implements SubjectSink<E, A>, Stream.Stream<R, E, A> {
  protected observers: Set<Stream.MulticastObserver<R, E, A>> = new Set()

  constructor(readonly name: string = 'Subject') {}

  readonly event = (a: A, trace?: Trace): void => {
    Array.from(this.observers).forEach((o) =>
      tryEvent(o.sink, {
        fiberId: o.context.fiberContext.fiberId,
        type: 'Event',
        operator: this.name,
        time: o.context.fiberContext.scheduler.getCurrentTime(),
        value: a,
        trace: fromNullable(trace),
      }),
    )
  }

  readonly error = (cause: Cause<E>, trace?: Trace): void => {
    Array.from(this.observers).forEach((o) =>
      o.sink.error({
        type: 'Error',
        fiberId: o.context.fiberContext.fiberId,
        operator: this.name,
        time: o.context.fiberContext.scheduler.getCurrentTime(),
        trace: fromNullable(trace),
        cause,
      }),
    )
  }

  readonly end = (trace?: Trace): void => {
    Array.from(this.observers).forEach((o) =>
      tryEnd(o.sink, {
        type: 'End',
        fiberId: o.context.fiberContext.fiberId,
        operator: this.name,
        time: o.context.fiberContext.scheduler.getCurrentTime(),
        trace: fromNullable(trace),
      }),
    )
  }

  readonly sink: SubjectSink<E, A> = {
    event: this.event,
    error: this.error,
    end: this.end,
  }

  readonly run = (sink: Sink<E, A>, context: StreamContext<R, E>) => {
    const observer: Stream.MulticastObserver<R, E, A> = { sink, context }

    this.observers.add(observer)

    return sync(() => this.observers.delete(observer))
  }
}

export interface SubjectSink<E, A> {
  readonly event: (value: A, trace?: Trace) => void
  readonly error: (cause: Cause<E>, trace?: Trace) => void
  readonly end: (trace?: Trace) => void
}
