import { pipe } from '@fp/function'
import { EqStrict } from 'fp-ts/Eq'

import * as E from './Env'
import { Queue } from './Queue'
import { createRef, getRef, Refs, WrappedRef } from './Ref'

export interface RefQueue<E, A> extends WrappedRef<Refs, E, Queue<A>> {}

export const createRefQueue = <E, A>(
  initial: E.Env<E, Queue<A>>,
  id: PropertyKey = Symbol(`RefQueue`),
): RefQueue<E, A> => createRef(initial, id, EqStrict)

export const fromId = <A>() => <Id extends PropertyKey>(id: Id) =>
  createRefQueue(
    E.asks((e: Readonly<Record<Id, Queue<A>>>) => e[id]),
    id,
  )

export const dequeue = <E, A>(queue: RefQueue<E, A>) =>
  pipe(
    queue,
    getRef,
    E.chainResumeK((q) => q.dequeue),
  )

export const peek = <E, A>(queue: RefQueue<E, A>) =>
  pipe(
    queue,
    getRef,
    E.chainResumeK((q) => q.peek),
  )

export const enqueue = <E, A>(queue: RefQueue<E, A>) => (
  ...values: readonly A[]
): E.Env<E & Refs, void> =>
  pipe(
    queue,
    getRef,
    E.chainResumeK((q) => q.enqueue(...values)),
  )
