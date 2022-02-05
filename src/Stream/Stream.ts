import { Option } from 'fp-ts/Option'

import { Disposable } from '@/Disposable'
import { FiberContext } from '@/FiberContext'
import { LocalScope } from '@/Scope'
import { Sink } from '@/Sink'
import { Trace } from '@/Trace'

export interface Stream<R, E, A> {
  readonly run: StreamRun<R, E, A>
}

export interface RStream<R, A> extends Stream<R, never, A> {}
export interface EStream<E, A> extends Stream<unknown, E, A> {}
export interface Of<A> extends Stream<unknown, never, A> {}

export type StreamRun<R, E, A> = (sink: Sink<E, A>, context: StreamContext<R, E>) => Disposable

export interface StreamContext<R, E> {
  readonly resources: R
  readonly fiberContext: FiberContext<E>
  readonly scope: LocalScope<E, any>
  readonly parentTrace: Option<Trace>
}

/**
 * Helps deal with adding traces to your events
 */
export const make = <R, E, A>(
  run: (sink: Sink<E, A>, context: StreamContext<R, E>) => Disposable,
): Stream<R, E, A> => ({
  run,
})
