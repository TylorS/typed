import { Stream } from '@most/types'
import { Eq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'
import { none, Option, some } from 'fp-ts/Option'

import { create } from './Adapter'
import { Branded } from './Branded'
import * as E from './Env'
import { deepEqualsEq } from './Eq'

export interface Ref<E, A> {
  readonly id: RefId
  readonly initial: E.Env<E, A>
  readonly eq: Eq<A>
}

export function createRef<E, A>(
  initial: E.Env<E, A>,
  id: PropertyKey = Symbol(),
  eq: Eq<A> = deepEqualsEq,
): Ref<E, A> {
  return {
    id: RefId(id),
    initial,
    eq,
  }
}

export type RefId = Branded<{ readonly RefId: unique symbol }, PropertyKey>
export const RefId = Branded<RefId>()

export interface References {
  readonly getRef: <E, A>(ref: Ref<E, A>) => E.Env<E, A>
  readonly setRef: <A>(value: A) => <E>(ref: Ref<E, A>) => E.Env<E, A>
  readonly deleteRef: <E, A>(ref: Ref<E, A>) => E.Env<unknown, Option<A>>
  readonly events: Stream<RefEvent<unknown>>
}

export type Refs = {
  readonly refs: References
}

export function getRef<E, A>(ref: Ref<E, A>): E.Env<E & Refs, A> {
  return pipe(
    E.asks((e: Refs) => e.refs.getRef(ref)),
    E.flatten,
  )
}

export function setRef<A>(value: A) {
  return <E>(ref: Ref<E, A>): E.Env<E & Refs, A> =>
    pipe(
      E.asks((e: Refs) => pipe(ref, e.refs.setRef(value))),
      E.flatten,
    )
}

export function deleteRef<E, A>(ref: Ref<E, A>): E.Env<Refs, Option<A>> {
  return pipe(
    E.asks((e: Refs) => e.refs.deleteRef(ref)),
    E.flatten,
  )
}

export function fromKey<A>(eq: Eq<A> = deepEqualsEq) {
  return <K extends PropertyKey>(key: K): Ref<Readonly<Record<K, A>>, A> =>
    createRef(
      E.fromReader((e: Readonly<Record<K, A>>) => e[key]),
      RefId(key),
      eq,
    )
}

export type RefEvent<A> = RefCreated<A> | RefUpdated<A> | RefDeleted

export type RefCreated<A> = {
  readonly type: 'created'
  readonly id: RefId
  readonly value: A
}

export type RefUpdated<A> = {
  readonly type: 'updated'
  readonly id: RefId
  readonly previousValue: A
  readonly value: A
}

export type RefDeleted = {
  readonly type: 'deleted'
  readonly id: RefId
}

export function createReferences(): References {
  const [sendEvent, events] = create<RefEvent<unknown>>()
  const references = new Map<RefId, unknown>()

  const createIfNotExists = (id: RefId) => <E, A>(env: E.Env<E, A>) => {
    const hasRef = references.has(id)

    return pipe(
      env,
      E.chainFirst((value) => E.fromIO(() => !hasRef && references.set(id, value))),
      E.chainFirst((value) =>
        E.fromIO<void, E>(() => !hasRef && sendEvent({ type: 'created', id, value })),
      ),
    )
  }

  function getRef<E, A>(ref: Ref<E, A>): E.Env<E, A> {
    const { id } = ref

    if (references.has(id)) {
      return E.of<A, E>(references.get(id)! as A)
    }

    return pipe(ref.initial, createIfNotExists(id))
  }

  function setRef<A>(value: A) {
    return <E>(ref: Ref<E, A>) =>
      pipe(
        ref,
        getRef,
        E.chainFirst(() => E.fromIO(() => references.set(ref.id, value))),
        E.chainFirst((previousValue) =>
          E.fromIO<void, E>(
            () =>
              !ref.eq.equals(previousValue)(value) &&
              sendEvent({ type: 'updated', id: ref.id, previousValue, value }),
          ),
        ),
      )
  }

  function deleteRef<E, A>(ref: Ref<E, A>) {
    const { id } = ref

    if (!references.has(id)) {
      return E.of(none)
    }

    const value = some(references.get(id)! as A)

    return pipe(
      E.fromIO(() => references.delete(id)),
      E.chainFirst(() => E.fromIO(() => sendEvent({ type: 'deleted', id }))),
      E.map(() => value),
    )
  }

  return {
    getRef,
    setRef,
    deleteRef,
    events,
  }
}
