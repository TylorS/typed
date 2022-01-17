import { Cause, Disposed } from '@/Cause'
import { Time } from '@/Clock'
import { Context } from '@/Context'
import { async, checkIsSync, Disposable, dispose, none, sync } from '@/Disposable'
import { Scope } from '@/Scope'
import { Sink, tryEnd, tryEvent } from '@/Sink'

import { Stream, StreamRun } from './Stream'

export function multicast<R, E, A>(stream: Stream<R, E, A>): Stream<R, E, A> {
  return new Multicast(stream)
}

export type MulticastObserver<R, E, A> = {
  readonly resources: R
  readonly sink: Sink<E, A>
  readonly context: Context<E>
  readonly scope: Scope<E, any>
}

export class Multicast<R, E, A> implements Stream<R, E, A>, Sink<E, A> {
  observers: Array<MulticastObserver<R, E, A>> = []
  disposable: Disposable = none

  constructor(readonly stream: Stream<R, E, A>) {}

  run: StreamRun<R, E, A> = (resources, sink, context, scope) => {
    const observer = { resources, sink, context, scope }

    this.observers.push(observer)

    if (this.observers.length === 1) {
      this.start(observer)
    }

    return new MulticastDisposable(this, observer)
  }

  private start(observer: MulticastObserver<R, E, A>) {
    this.disposable = this.run(observer.resources, this, observer.context, observer.scope)
  }

  event(time: Time, value: A) {
    this.observers.forEach((o) => tryEvent(o.sink, time, value))
  }

  error(time: Time, cause: Cause<E>) {
    this.observers.forEach((o) => o.sink.error(time, cause))
  }

  end(time: Time) {
    this.observers.forEach((o) => tryEnd(o.sink, time))
  }
}

export class MulticastDisposable<R, E, A> implements Disposable {
  constructor(
    readonly multicast: Multicast<R, E, A>,
    readonly observer: MulticastObserver<R, E, A>,
  ) {}

  get dispose() {
    return (
      this.multicast.observers.length === 1 ? this.disposeMulticast() : this.disposeObserver()
    ).dispose
  }

  disposeMulticast() {
    if (checkIsSync(this.multicast.disposable)) {
      return sync(() => {
        // Notify remaining of dispose
        this.multicast.observers.forEach((o) =>
          o.sink.error(o.context.scheduler.getCurrentTime(), Disposed(o.context.fiberId)),
        )

        dispose(this.disposeObserver())

        if (this.multicast.observers.length === 0) {
          dispose(this.multicast.disposable)
        }
      })
    }

    return async(async () => {
      // Notify remaining of dispose
      this.multicast.observers.forEach((o) =>
        o.sink.error(o.context.scheduler.getCurrentTime(), Disposed(o.context.fiberId)),
      )

      dispose(this.disposeObserver())

      if (this.multicast.observers.length === 0) {
        return await dispose(this.multicast.disposable)
      }
    })
  }

  disposeObserver() {
    return sync(() => {
      const i = this.multicast.observers.findIndex((x) => x === this.observer)

      if (i > -1) {
        this.multicast.observers.splice(i, 1)
      }
    })
  }
}
