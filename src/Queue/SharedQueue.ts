import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { readSharedRef, SharedRef, SharedRefEnv } from '@typed/fp/SharedRef/exports'
import { Option } from 'fp-ts/Option'

import { Queue } from './Queue'

export interface SharedQueue<K extends PropertyKey, A> extends SharedRef<K, Queue<A>> {}

export type SharedQueueValue<A> = A extends SharedQueue<any, infer R> ? R : never

export const wrapSharedQueue = <Q extends SharedQueue<any, any>>(
  queue: Q,
): WrappedSharedQueue<Q> => ({
  enqueue: (...values: ReadonlyArray<SharedQueueValue<Q>>) => enqueue(values, queue),
  dequeue: dequeue(queue),
  dequeueAll: dequeueAll(queue),
  peek: peek(queue),
  some: (f: (value: SharedQueueValue<Q>) => boolean) => some(f, queue),
  remove: (f: (value: SharedQueueValue<Q>) => boolean) => remove(f, queue),
})

export type WrappedSharedQueue<Q extends SharedQueue<any, any>> = {
  readonly enqueue: (...values: ReadonlyArray<SharedQueueValue<Q>>) => Effect<SharedRefEnv<Q>, void>
  readonly dequeue: Effect<SharedRefEnv<Q>, Option<SharedQueueValue<Q>>>
  readonly dequeueAll: Effect<SharedRefEnv<Q>, ReadonlyArray<SharedQueueValue<Q>>>
  readonly peek: Effect<SharedRefEnv<Q>, Option<SharedQueueValue<Q>>>
  readonly some: (f: (value: SharedQueueValue<Q>) => boolean) => Effect<SharedRefEnv<Q>, boolean>
  readonly remove: (f: (value: SharedQueueValue<Q>) => boolean) => Effect<SharedRefEnv<Q>, void>
}

export const enqueue = <A, K extends PropertyKey>(
  values: ReadonlyArray<A>,
  queue: SharedQueue<K, A>,
): Effect<SharedRefEnv<SharedQueue<K, A>>, void> => {
  const eff = doEffect(function* () {
    const q: Queue<A> = yield* readSharedRef(queue)

    q.enqueue(...values)
  })

  return eff
}

export const dequeue = <K extends PropertyKey, A>(
  queue: SharedQueue<K, A>,
): Effect<SharedRefEnv<SharedQueue<K, A>>, Option<A>> => {
  const eff = doEffect(function* () {
    const q: Queue<A> = yield* readSharedRef(queue)

    return q.dequeue()
  })

  return eff
}

export const dequeueAll = <K extends PropertyKey, A>(
  queue: SharedQueue<K, A>,
): Effect<SharedRefEnv<SharedQueue<K, A>>, ReadonlyArray<A>> => {
  const eff = doEffect(function* () {
    const q: Queue<A> = yield* readSharedRef(queue)

    return q.dequeueAll()
  })

  return eff
}

export const peek = <K extends PropertyKey, A>(
  queue: SharedQueue<K, A>,
): Effect<SharedRefEnv<SharedQueue<K, A>>, Option<A>> => {
  const eff = doEffect(function* () {
    const q: Queue<A> = yield* readSharedRef(queue)

    return q.peek()
  })

  return eff
}

export const some = <K extends PropertyKey, A>(
  f: (value: A) => boolean,
  queue: SharedQueue<K, A>,
): Effect<SharedRefEnv<SharedQueue<K, A>>, boolean> => {
  const eff = doEffect(function* () {
    const q: Queue<A> = yield* readSharedRef(queue)

    return q.some(f)
  })

  return eff
}

export const remove = <K extends PropertyKey, A>(
  f: (value: A) => boolean,
  queue: SharedQueue<K, A>,
): Effect<SharedRefEnv<SharedQueue<K, A>>, void> => {
  const eff = doEffect(function* () {
    const q: Queue<A> = yield* readSharedRef(queue)

    return q.remove(f)
  })

  return eff
}
