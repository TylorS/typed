import * as O from 'fp-ts/Option'

import { Cause, Unexpected } from '@/Cause'
import { Time } from '@/Clock'
import * as D from '@/Disposable'
import { dispose } from '@/Disposable'
import { fromIO } from '@/Effect'
import { tryEvent } from '@/Sink'

import { Multicast, MulticastObserver } from './multicast'
import { StreamRun } from './Stream'

export class Hold<R, E, A> extends Multicast<R, E, A> {
  protected lastValue: O.Option<A> = O.none
  protected pendingObservers: Array<MulticastObserver<R, E, A>> = []
  protected task: D.Disposable = D.none

  run: StreamRun<R, E, A> = (resources, sink, context, scope) => {
    const observer: MulticastObserver<R, E, A> = { resources, sink, context, scope }

    if (this.shouldScheduleFlush()) {
      this.scheduleFlush(observer)
    }

    return super.run(resources, sink, context, scope)
  }

  event(time: Time, value: A) {
    this.flushPending()
    this.lastValue = O.some(value)

    return super.event(time, value)
  }

  error(time: Time, cause: Cause<E>) {
    this.flushPending()

    return super.error(time, cause)
  }

  end(time: Time) {
    this.flushPending()
    return super.end(time)
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
      this.error(observer.context.scheduler.getCurrentTime(), Unexpected(e))
    }
  }

  protected flushPending() {
    if (this.pendingObservers.length > 0 && O.isSome(this.lastValue)) {
      const value = this.lastValue.value
      const observers = this.pendingObservers
      this.pendingObservers = []

      observers.forEach((o) => tryEvent(o.sink, o.context.scheduler.getCurrentTime(), value))
    }
  }
}
