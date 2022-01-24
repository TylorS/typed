import { pipe } from 'fp-ts/function'

import { Context } from '@/Context'
import { Disposable, DisposableQueue, disposeAll } from '@/Disposable'
import { extendScope, LocalScope } from '@/Scope'
import { EventElement, Sink } from '@/Sink'

import { addOperator, Stream, Tracer } from './Stream'

export function chain<A, R2, E2, B>(f: (a: A) => Stream<R2, E2, B>) {
  return <R, E>(stream: Stream<R, E, A>): Stream<R & R2, E | E2, B> => new Chain(stream, f)
}

export class Chain<R, E, A, R2, E2, B> implements Stream<R & R2, E | E2, B> {
  constructor(readonly stream: Stream<R, E, A>, readonly f: (a: A) => Stream<R2, E2, B>) {}

  run(
    resources: R & R2,
    sink: Sink<E | E2, B>,
    context: Context<E | E2>,
    scope: LocalScope<E | E2, any>,
    tracer: Tracer<E | E2>,
  ) {
    const s = new ChainSink(resources, sink, context, scope, tracer, this.f as any)

    return disposeAll([
      s,
      this.stream.run(
        resources,
        s,
        context,
        scope as any,
        pipe(tracer, addOperator('chain')) as any,
      ),
    ])
  }
}

class ChainSink<R2, E2, E, A, B> implements Sink<E, A>, Disposable {
  protected ended = false
  protected remaining = 0
  protected queue = new DisposableQueue()

  constructor(
    readonly resources: R2,
    readonly sink: Sink<E | E2, B>,
    readonly context: Context<E | E2>,
    readonly scope: LocalScope<E, any>,
    readonly tracer: Tracer<E2>,
    readonly f: (a: A) => Stream<R2, E2, B>,
  ) {}

  event: (event: EventElement<A>) => void = (event) => {
    const stream = this.f.call(null, event.value)

    return stream.run(
      this.resources,
      this.innerSink(),
      this.context,
      extendScope(this.scope),
      this.tracer,
    )
  }

  error = this.sink.error

  end = () => {
    this.ended = false
  }

  protected innerSink(): Sink<E2, B> {
    this.remaining++

    return {
      event: this.sink.event,
      error: this.sink.error,
      end: (event) => {
        if (--this.remaining === 0 && this.ended) {
          this.sink.end(event)
        }
      },
    }
  }

  get dispose() {
    return this.queue.dispose
  }
}
