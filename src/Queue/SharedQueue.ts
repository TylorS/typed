import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { readSharedRef, SharedRef, SharedRefEnv } from '@typed/fp/SharedRef/exports'
import { Option } from 'fp-ts/Option'

import { Queue } from './Queue'

export interface SharedQueue<K extends PropertyKey, A> extends SharedRef<K, Queue<A>> {}

export type SharedQueueValue<A> = A extends SharedQueue<any, infer R> ? R : never

export const wrapSharedQueue = <Q extends SharedQueue<any, any>>(
  queue: Q,
): readonly [
  (value: SharedQueueValue<Q>) => Effect<SharedRefEnv<Q>, void>,
  Effect<SharedRefEnv<Q>, Option<SharedQueueValue<Q>>>,
  Effect<SharedRefEnv<Q>, Option<SharedQueueValue<Q>>>,
] => [(value: SharedQueueValue<Q>) => enqueue(queue, value), dequeue(queue), peek(queue)]

export const enqueue = <A, K extends PropertyKey>(
  value: A,
  queue: SharedQueue<K, A>,
): Effect<SharedRefEnv<SharedQueue<K, A>>, void> => {
  const eff = doEffect(function* () {
    const q: Queue<A> = yield* readSharedRef(queue)

    q.enqueue(value)
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

export const peek = <K extends PropertyKey, A>(
  queue: SharedQueue<K, A>,
): Effect<SharedRefEnv<SharedQueue<K, A>>, Option<A>> => {
  const eff = doEffect(function* () {
    const q: Queue<A> = yield* readSharedRef(queue)

    return q.peek()
  })

  return eff
}
