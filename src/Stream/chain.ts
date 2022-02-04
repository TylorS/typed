import { some } from 'fp-ts/Option'

import { prettyStringify } from '@/Cause'
import { Disposable, DisposableQueue, disposeAll } from '@/Disposable'
import { EndElement, ErrorElement, EventElement, Sink } from '@/Sink'
import { Trace, traceLocation } from '@/Trace'

import { Stream, StreamContext } from './Stream'

export function chain<A, R2, E2, B>(f: (a: A) => Stream<R2, E2, B>) {
  return <R, E>(stream: Stream<R, E, A>): Stream<R & R2, E | E2, B> => new Chain(stream, f)
}

export class Chain<R, E, A, R2, E2, B> implements Stream<R & R2, E | E2, B> {
  constructor(readonly stream: Stream<R, E, A>, readonly f: (a: A) => Stream<R2, E2, B>) {}

  run(sink: Sink<E | E2, B>, context: StreamContext<R & R2, E | E2>) {
    const s = new ChainSink(sink, context, this.f)

    return disposeAll([s, this.stream.run(s, context as any)])
  }
}

class ChainSink<R2, E2, E, A, B> implements Sink<E, A>, Disposable {
  protected ended = false
  protected remaining = 0
  protected queue = new DisposableQueue()
  protected count = 0

  constructor(
    readonly sink: Sink<E | E2, B>,
    readonly context: StreamContext<R2, E | E2>,
    readonly f: (a: A) => Stream<R2, E2, B>,
  ) {}

  event: (event: EventElement<A>) => void = (event) => {
    const stream = this.f.call(null, event.value)

    this.queue.add(
      stream.run(this.innerSink(event, stream?.constructor?.name), this.context as any),
    )
  }

  error = (event: ErrorElement<E | E2>) => {
    this.ended = true

    this.sink.error({ ...event, trace: some(this.context.tracer.error(event)) })
  }

  end = (event: EndElement) => {
    this.ended = true

    if (this.remaining === 0) {
      this.sink.end({ ...event, trace: some(this.context.tracer.end(event)) })
    }
  }

  protected innerSink(startEvent: EventElement<A>, name = ''): Sink<E2, B> {
    this.remaining++

    const parentTrace = new Trace(
      this.context.fiberContext.fiberId,
      [
        traceLocation(
          `Stream Event :: chain (${startEvent.time})${
            name && name !== 'Object' ? ` :: ${name}` : ''
          } :: ${prettyStringify(startEvent.value, 2)}`,
        ),
      ],
      some(this.context.tracer.event(startEvent)),
    )

    return {
      event: (event) => {
        this.sink.event({
          ...event,
          trace: some(
            this.context.tracer.prependParentTrace(parentTrace, this.context.tracer.event(event)),
          ),
        })
      },
      error: (event) =>
        this.sink.error({
          ...event,
          trace: some(
            this.context.tracer.prependParentTrace(parentTrace, this.context.tracer.error(event)),
          ),
        }),
      end: (event) => {
        if (--this.remaining === 0 && this.ended) {
          this.sink.end({
            ...event,
            trace: some(
              this.context.tracer.prependParentTrace(parentTrace, this.context.tracer.end(event)),
            ),
          })
        }
      },
    }
  }

  get dispose() {
    return this.queue.dispose
  }
}
