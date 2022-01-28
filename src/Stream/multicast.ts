import { Disposed } from '@/Cause'
import { async, checkIsSync, Disposable, dispose, none, sync } from '@/Disposable'
import { EndElement, ErrorElement, EventElement, Sink, tryEnd, tryEvent } from '@/Sink'

import { Stream, StreamContext, StreamRun } from './Stream'

export function multicast<R, E, A>(stream: Stream<R, E, A>): Stream<R, E, A> {
  return new Multicast(stream)
}

export type MulticastObserver<R, E, A> = {
  readonly sink: Sink<E, A>
  readonly context: StreamContext<R, E>
}

export class Multicast<R, E, A> implements Stream<R, E, A>, Sink<E, A> {
  observers: Array<MulticastObserver<R, E, A>> = []
  disposable: Disposable = none

  constructor(readonly stream: Stream<R, E, A>, readonly operator: string = 'multicast') {}

  run: StreamRun<R, E, A> = (sink, context) => {
    const observer = { sink, context }

    this.observers.push(observer)

    if (this.observers.length === 1) {
      this.start(observer)
    }

    return new MulticastDisposable(this, observer)
  }

  private start(observer: MulticastObserver<R, E, A>) {
    this.disposable = this.run(this, observer.context)
  }

  event(event: EventElement<A>) {
    this.observers.forEach((o) => tryEvent(o.sink, event))
  }

  error(event: ErrorElement<E>) {
    this.observers.forEach((o) => o.sink.error(event))
  }

  end(event: EndElement) {
    this.observers.forEach((o) => tryEnd(o.sink, event))
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
          o.sink.error({
            type: 'Error',
            operator: this.multicast.operator,
            time: o.context.fiberContext.scheduler.getCurrentTime(),
            cause: Disposed(o.context.fiberContext.fiberId),
            fiberId: o.context.fiberContext.fiberId,
          }),
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
        o.sink.error({
          type: 'Error',
          operator: this.multicast.operator,
          time: o.context.fiberContext.scheduler.getCurrentTime(),
          cause: Disposed(o.context.fiberContext.fiberId),
          fiberId: o.context.fiberContext.fiberId,
        }),
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
