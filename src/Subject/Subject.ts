import { none } from 'fp-ts/Option'

import { Cause } from '@/Cause'
import { sync } from '@/Disposable'
import { Sink, tryEnd, tryEvent } from '@/Sink'
import * as Stream from '@/Stream'
import { StreamContext } from '@/Stream'

export class Subject<R, E, A> implements SubjectSink<E, A>, Stream.Stream<R, E, A> {
  protected observers: Set<Stream.MulticastObserver<R, E, A>> = new Set()

  constructor(readonly name: string = 'Subject') {}

  readonly event = (a: A): void => {
    Array.from(this.observers).forEach((o) =>
      tryEvent(o.sink, {
        fiberId: o.context.fiberContext.fiberId,
        type: 'Event',
        operator: this.name,
        time: o.context.fiberContext.scheduler.getCurrentTime(),
        value: a,
        trace: none,
      }),
    )
  }

  readonly error = (cause: Cause<E>): void => {
    Array.from(this.observers).forEach((o) =>
      o.sink.error({
        type: 'Error',
        fiberId: o.context.fiberContext.fiberId,
        operator: this.name,
        time: o.context.fiberContext.scheduler.getCurrentTime(),
        cause,
      }),
    )
  }

  readonly end = (): void => {
    Array.from(this.observers).forEach((o) =>
      tryEnd(o.sink, {
        type: 'End',
        fiberId: o.context.fiberContext.fiberId,
        operator: this.name,
        time: o.context.fiberContext.scheduler.getCurrentTime(),
        trace: none,
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
  readonly event: (value: A) => void
  readonly error: (cause: Cause<E>) => void
  readonly end: () => void
}
