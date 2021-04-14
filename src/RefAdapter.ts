import { pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import { Disposable, Sink } from '@most/types'

import { Adapter, create } from './Adapter'
import * as E from './Env'
import { createRef, getRef, Ref, Refs } from './Ref'
import { getScheduler, SchedulerEnv } from './Scheduler'
import { createSink } from './Stream'

export interface RefAdapter<E, A, B = A> extends Ref<E, Adapter<A, B>> {}

export function createRefAdapter<A>(id: PropertyKey = Symbol(`RefAdapter`)) {
  return createRef(
    E.fromIO(() => create<A>()),
    id,
  )
}

export const sendEvent = <E, A, B>(adapter: RefAdapter<E, A, B>) => (
  event: A,
): E.Env<E & Refs, void> =>
  pipe(
    adapter,
    getRef,
    E.chain((a) => E.fromIO(() => a[0](event))),
  )

export const getSendEvent = <E, A, B>(
  adapter: RefAdapter<E, A, B>,
): E.Env<E & Refs, (event: A) => void> =>
  pipe(
    adapter,
    getRef,
    E.map((a) => a[0]),
  )

export const listenToEvents = <E, A, B>(adapter: RefAdapter<E, A, B>) => (
  sink: Readonly<Partial<Sink<B>>>,
): E.Env<E & Refs & SchedulerEnv, Disposable> =>
  Do(function* (_) {
    const [, stream] = yield* _(getRef(adapter))
    const scheduler = yield* _(getScheduler)

    return stream.run(createSink(sink), scheduler)
  })

export const getListenToEvents = <E, A, B>(
  adapter: RefAdapter<E, A, B>,
): E.Env<E & Refs & SchedulerEnv, (sink: Readonly<Partial<Sink<B>>>) => Disposable> =>
  Do(function* (_) {
    const [, stream] = yield* _(getRef(adapter))
    const scheduler = yield* _(getScheduler)

    return (sink: Readonly<Partial<Sink<B>>>) => stream.run(createSink(sink), scheduler)
  })
