import * as O from 'fp-ts/Option'

import { Unexpected } from '@/Cause'
import * as D from '@/Disposable'
import { dispose } from '@/Disposable'
import { fromIO } from '@/Effect'
import { EndElement, ErrorElement, EventElement, tryEvent } from '@/Sink'

import { Multicast, MulticastObserver } from './multicast'
import { StreamRun } from './Stream'

export class Hold<R, E, A> extends Multicast<R, E, A> {
  protected lastValue: O.Option<A> = O.none
  protected pendingObservers: Array<MulticastObserver<R, E, A>> = []
  protected task: D.Disposable = D.none

  run: StreamRun<R, E, A> = (resources, sink, context, scope, tracer) => {
    const observer: MulticastObserver<R, E, A> = { resources, sink, context, scope, tracer }

    if (this.shouldScheduleFlush()) {
      this.scheduleFlush(observer)
    }

    return super.run(resources, sink, context, scope, tracer)
  }

  event(event: EventElement<A>) {
    this.flushPending()
    this.lastValue = O.some(event.value)

    return super.event(event)
  }

  error(event: ErrorElement<E>) {
    this.flushPending()

    return super.error(event)
  }

  end(event: EndElement) {
    this.flushPending()
    return super.end(event)
  }

  protected shouldScheduleFlush() {
    return O.isSome(this.lastValue) && this.pendingObservers.length > 0
  }

  protected async scheduleFlush(observer: MulticastObserver<R, E, A>) {
    try {
      await dispose(this.task)

      this.task = observer.context.scheduler.asap(
        fromIO(() => this.flushPending()),
        observer.resources,
        observer.context,
        observer.scope,
      )
    } catch (e) {
      this.error({
        type: 'Error',
        operator: this.operator,
        time: observer.context.scheduler.getCurrentTime(),
        cause: Unexpected(e),
      })
    }
  }

  protected flushPending() {
    if (this.pendingObservers.length > 0 && O.isSome(this.lastValue)) {
      const value = this.lastValue.value
      const observers = this.pendingObservers
      this.pendingObservers = []

      observers.forEach((o) => {
        const event: EventElement<A> = {
          type: 'Event',
          operator: this.operator,
          time: o.context.scheduler.getCurrentTime(),
          value,
          trace: O.none,
        }

        tryEvent(o.sink, o.tracer.makeTrace(event))
      })
    }
  }
}
