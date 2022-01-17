import { IO } from 'fp-ts/IO'

import { Unexpected } from '@/Cause'
import { Context } from '@/Context'
import { Disposable } from '@/Disposable'
import * as FromIO from '@/Effect/FromIO'
import { Scope } from '@/Scope'
import { Sink } from '@/Sink'

export interface Stream<R, E, A> {
  readonly run: StreamRun<R, E, A>
}

export interface RStream<R, A> extends Stream<R, never, A> {}
export interface EStream<E, A> extends Stream<unknown, E, A> {}
export interface Of<A> extends Stream<unknown, never, A> {}

export type StreamRun<R, E, A> = (
  resources: R,
  sink: Sink<E, A>,
  context: Context<E>,
  scope: Scope<E, any>,
) => Disposable

export const make = <R, E, A>(run: StreamRun<R, E, A>): Stream<R, E, A> => ({
  run,
})

export const withInputs = <R, E, A>(
  f: (resources: R, sink: Sink<E, A>, context: Context<E>, scope: Scope<E, any>) => A,
  trace?: string,
): Stream<R, E, A> =>
  make((resources, sink, context, scope) =>
    fromIO<A, E>(() => f(resources, sink, context, scope), trace).run(
      resources,
      sink,
      context,
      scope,
    ),
  )

export const ask = <R>(trace?: string): Stream<R, never, R> => withInputs((r) => r, trace)

export const asks = <R, A>(f: (r: R) => A, trace?: string): Stream<R, never, A> =>
  withInputs((r) => f(r), trace)

export const getContext = <E = never>(trace?: string): Stream<unknown, E, Context<E>> =>
  withInputs((_resources, _sink, context) => context, trace)

export const fromIO = <A, E = never>(io: IO<A>, trace?: string): EStream<E, A> =>
  make<unknown, E, A>((resources, sink, context, scope) =>
    context.scheduler.asap(
      FromIO.fromIO(() => {
        const time = context.scheduler.getCurrentTime()

        try {
          sink.event(time, io())
          sink.end(time)
        } catch (e) {
          sink.error(context.scheduler.getCurrentTime(), Unexpected(e))
        }
      }, trace),
      resources,
      context,
      scope,
    ),
  )
