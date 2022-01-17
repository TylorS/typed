import { Cause } from '@/Cause'
import { Context } from '@/Context'
import { sync } from '@/Disposable'
import { Scope } from '@/Scope'
import { Sink, tryEnd, tryEvent } from '@/Sink'
import * as Stream from '@/Stream'

export class Subject<R, E, A> implements SubjectSink<E, A>, Stream.Stream<R, E, A> {
  protected observers: Set<Stream.MulticastObserver<R, E, A>> = new Set()

  readonly event = (a: A): void => {
    Array.from(this.observers).forEach((o) =>
      tryEvent(o.sink, o.context.scheduler.getCurrentTime(), a),
    )
  }

  readonly error = (cause: Cause<E>): void => {
    Array.from(this.observers).forEach((o) =>
      o.sink.error(o.context.scheduler.getCurrentTime(), cause),
    )
  }

  readonly end = (): void => {
    Array.from(this.observers).forEach((o) => tryEnd(o.sink, o.context.scheduler.getCurrentTime()))
  }

  readonly sink: SubjectSink<E, A> = {
    event: this.event,
    error: this.error,
    end: this.end,
  }

  readonly run = (resources: R, sink: Sink<E, A>, context: Context<E>, scope: Scope<E, any>) => {
    const observer: Stream.MulticastObserver<R, E, A> = { resources, sink, context, scope }

    this.observers.add(observer)

    return sync(() => this.observers.delete(observer))
  }
}

export interface SubjectSink<E, A> {
  readonly event: (value: A) => void
  readonly error: (cause: Cause<E>) => void
  readonly end: () => void
}
