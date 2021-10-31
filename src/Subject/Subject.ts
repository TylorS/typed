import { pipe } from 'fp-ts/function'

import { Context } from '@/Context'
import { Disposable } from '@/Disposable'
import { Fx, withinContext } from '@/Fx'
import { release, Scope } from '@/Scope'
import { Sink, Stream } from '@/Stream'

export type Subject<R, I, O = I> = readonly [sink: Sink<I>, stream: Stream<R, O>]

export const make = <I>(): Subject<unknown, I> => {
  const sinks: Array<readonly [Sink<I>, Context, Scope<any, any>]> = []
  const sink: Sink<I> = {
    event: (i) =>
      Fx(function* () {
        for (const [sink, context] of sinks) {
          yield* pipe(i, sink.event, withinContext(context))
        }
      }),
    error: (error) =>
      Fx(function* () {
        for (const [sink, context, scope] of sinks) {
          yield* pipe(error, sink.error, withinContext(context))
          yield* pipe(scope, release, withinContext(context))
        }
      }),
    end: Fx(function* () {
      for (const [sink, context, scope] of sinks) {
        yield* pipe(sink.end, withinContext(context))
        yield* pipe(scope, release, withinContext(context))
      }
    }),
  }

  const stream: Stream<unknown, I> = {
    run: (sink, { scope, context }): Disposable => {
      const triple = [sink, context, scope] as const

      sinks.push(triple)

      return {
        dispose: () => {
          const i = sinks.findIndex((x) => x === triple)

          if (i > -1) {
            sinks.splice(i, 1)
          }
        },
      }
    },
  }

  return [sink, stream] as const
}
