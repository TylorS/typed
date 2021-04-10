import { Stream } from '@most/types'
import { Eq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'
import { none, Option, some } from 'fp-ts/Option'

import { create } from './Adapter'
import { Branded } from './Branded'
import * as E from './Env'
import { deepEqualsEq } from './Eq'
import { Arity1 } from './function'

/**
 * A reference to a value. When attempting to retrieve a Ref's value using
 * `getRef`, and the value is not available, Ref.initial will be used to seed that value
 * and be returned. A Ref is deliberately separate from the environment in which you retrieve the
 * value so that Refs can be reused in various contexts without needing a new RefId.
 */
export interface Ref<E, A> {
  readonly id: RefId
  readonly initial: E.Env<E, A>
  readonly eq: Eq<A>
}

export type RefEnv<A> = A extends Ref<infer R, any> ? R : never

export type RefValue<A> = A extends Ref<any, infer R> ? R : never

export function createRef<E, A>(
  initial: E.Env<E, A>,
  id: PropertyKey = Symbol(`Ref`),
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
  readonly references: ReadonlyMap<RefId, unknown>
  readonly events: Stream<RefEvent<unknown>>
  readonly getRef: <E, A>(ref: Ref<E, A>) => E.Env<E, A>
  readonly setRef: <A>(value: A) => <E>(ref: Ref<E, A>) => E.Env<E, A>
  readonly deleteRef: <E, A>(ref: Ref<E, A>) => E.Env<unknown, Option<A>>
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

export function modifyRef<A>(f: Arity1<A, A>) {
  return <E>(ref: Ref<E, A>) =>
    pipe(
      ref,
      getRef,
      E.chain((a) => pipe(ref, pipe(a, f, setRef))),
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

export function createReferences(refs: Iterable<readonly [RefId, unknown]> = []): References {
  const references = new Map(refs)
  const [sendEvent, events] = create<RefEvent<unknown>>()

  function getRef<E, A>(ref: Ref<E, A>): E.Env<E, A> {
    const { id } = ref

    if (references.has(id)) {
      return E.of<A, E>(references.get(id)! as A)
    }

    return pipe(
      ref.initial,
      E.chainFirst((value) => E.fromIO(() => references.set(id, value))),
      E.chainFirst((value) => E.fromIO<void, E>(() => sendEvent({ type: 'created', id, value }))),
    )
  }

  function setRef<A>(value: A) {
    return <E>(ref: Ref<E, A>): E.Env<E, A> =>
      pipe(
        ref,
        getRef,
        E.chainFirst(() => E.fromIO(() => references.set(ref.id, value))),
        E.chainFirst((previousValue) =>
          E.fromIO<void, E>(
            () =>
              !pipe(value, ref.eq.equals(previousValue)) &&
              sendEvent({ type: 'updated', id: ref.id, previousValue, value }),
          ),
        ),
      )
  }

  function deleteRef<E, A>(ref: Ref<E, A>): E.Env<unknown, Option<A>> {
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
    references,
    events,
    getRef,
    setRef,
    deleteRef,
  }
}
