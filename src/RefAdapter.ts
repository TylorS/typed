import { Adapter, create } from '@fp/Adapter'
import * as E from '@fp/Env'
import { CurrentFiber, DoF } from '@fp/Fiber'
import { pipe } from '@fp/function'
import { ContextRef, createContext } from '@fp/hooks'
import { getScheduler, SchedulerEnv } from '@fp/Scheduler'
import { createSink } from '@fp/Stream'
import { Disposable, Sink } from '@most/types'
import { flow } from 'fp-ts/function'

export interface RefAdapter<A, B = A> extends ContextRef<unknown, Adapter<A, B>> {}

export function makeRefAdapter<A>(id: PropertyKey = Symbol(`RefAdapter`)): RefAdapter<A> {
  return createContext(E.fromIO<Adapter<A>>(create), id)
}

export const getSendEvent = <A, B>(
  adapter: RefAdapter<A, B>,
): E.Env<CurrentFiber, (event: A) => void> =>
  pipe(
    adapter.get,
    E.map((a) => a[0]),
  )

export const sendEvent = <A, B>(adapter: RefAdapter<A, B>) => (
  event: A,
): E.Env<CurrentFiber, void> =>
  pipe(
    adapter,
    getSendEvent,
    E.chainIOK((f) => () => f(event)),
  )

export const getListenToEvents = <A, B>(
  adapter: RefAdapter<A, B>,
): E.Env<CurrentFiber & SchedulerEnv, (sink: Readonly<Partial<Sink<B>>>) => Disposable> =>
  DoF(function* (_) {
    const [, stream] = yield* _(adapter.get)
    const scheduler = yield* _(getScheduler)

    return (sink: Readonly<Partial<Sink<B>>>) => stream.run(createSink(sink), scheduler)
  })

export const listenToEvents = <A, B>(adapter: RefAdapter<A, B>) => (
  sink: Readonly<Partial<Sink<B>>>,
): E.Env<CurrentFiber & SchedulerEnv, Disposable> =>
  pipe(
    adapter,
    getListenToEvents,
    E.map((f) => f(sink)),
  )

export interface WrappedRefAdapter<A, B = A> extends RefAdapter<A, B> {
  readonly getSendEvent: E.Env<CurrentFiber, (event: A) => void>
  readonly sendEvent: (event: A) => E.Env<CurrentFiber, void>
  readonly getListenToEvents: E.Env<
    CurrentFiber & SchedulerEnv,
    (sink: Readonly<Partial<Sink<B>>>) => Disposable
  >
  readonly listenToEvents: (
    sink: Readonly<Partial<Sink<B>>>,
  ) => E.Env<CurrentFiber & SchedulerEnv, Disposable>
}

export function wrapRefAdapter<A, B>(adapter: RefAdapter<A, B>): WrappedRefAdapter<A, B> {
  return {
    ...adapter,
    getSendEvent: getSendEvent(adapter),
    sendEvent: sendEvent(adapter),
    getListenToEvents: getListenToEvents(adapter),
    listenToEvents: listenToEvents(adapter),
  }
}

export const createRefAdapter = flow(makeRefAdapter, wrapRefAdapter)
