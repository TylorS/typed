import { Stream } from '@most/types'
import { Eq } from 'fp-ts/Eq'
import { flow, pipe } from 'fp-ts/function'
import { none, Option, some } from 'fp-ts/Option'

import { create } from './Adapter'
import { Branded } from './Branded'
import * as E from './Env'
import { deepEqualsEq } from './Eq'
import { Arity1 } from './function'
import { Resume, sync } from './Resume'

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

/**
 * Extracts the Environment required to run a reference within
 */
export type RefEnv<A> = A extends Ref<infer R, any> ? R : never

/**
 * Extracts the value a Reference will eventually be holding.
 */
export type RefValue<A> = A extends Ref<any, infer R> ? R : never

/**
 * Create a new Ref instance
 */
export function makeRef<E, A>(
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

/**
 * Lets us distinguish RefId's from any other kind of string | number | boolean
 */
export type RefId = Branded<{ readonly RefId: unique symbol }, PropertyKey>

/**
 * Lets us construct RefIds
 */
export const RefId = Branded<RefId>()

/**
 * References is an interface which has a sync or asynchronous implementation of a
 * key-value pairs, with get/set/delete/has capabilities as well a @most/core Stream
 * that allows a subscriber to listen in realtime what changes are occuring to the references.
 */
export interface References {
  /**
   * A @most/core stream containing all of the happening within the References
   */
  readonly events: Stream<RefEvent<unknown>>
  readonly sendEvent: (event: RefEvent<unknown>) => void

  /**
   * Get the current value of a Ref, possibly executing the initial effect
   * associated with that Ref and sending a RefCreated event.
   */
  readonly getRef: <E, A>(ref: Ref<E, A>) => E.Env<E, A>

  /**
   * Check if a reference is currently stored in the environment.
   */
  readonly hasRef: <E, A>(ref: Ref<E, A>) => E.Env<unknown, boolean>

  /**
   * Set the value of a Ref, the provided Eq instance contained within the
   * Ref to determine if it should send a corresponding RefUpdated event
   * with the previous and current value.
   */
  readonly setRef: <A>(value: A) => <E>(ref: Ref<E, A>) => E.Env<E, A>

  /**
   * Deletes references to a current value with a Ref, if it exists a Some of
   * that value will be returned signalling a deletion has occurred or a None
   * in the event the reference does not exist.
   */
  readonly deleteRef: <E, A>(ref: Ref<E, A>) => E.Env<unknown, Option<A>>

  /**
   * Creates a clone of your references if supports this behavior. A None will
   * be returned if it is not supported, Some<References> otherwise.
   */
  readonly clone: Resume<Option<References>>
}

export type Refs = {
  readonly refs: References
}

export function getRef<E, A>(ref: Ref<E, A>): E.Env<E & Refs, A> {
  return E.asksE((e: Refs) => e.refs.getRef(ref))
}

export function hasRef<E, A>(ref: Ref<E, A>): E.Env<E & Refs, boolean> {
  return E.asksE((e: Refs) => e.refs.hasRef(ref))
}

export function setRef<E, A>(ref: Ref<E, A>) {
  return (value: A): E.Env<E & Refs, A> => E.asksE((e: Refs) => pipe(ref, e.refs.setRef(value)))
}

export function setRef_<A>(value: A) {
  return <E>(ref: Ref<E, A>): E.Env<E & Refs, A> => setRef(ref)(value)
}

export function deleteRef<E, A>(ref: Ref<E, A>): E.Env<Refs, Option<A>> {
  return E.asksE((e: Refs) => e.refs.deleteRef(ref))
}

export function modifyRef<E, A>(ref: Ref<E, A>) {
  return (f: Arity1<A, A>) => pipe(ref, getRef, E.chain(flow(f, setRef(ref))))
}

export function modifyRef_<A>(f: Arity1<A, A>) {
  return <E>(ref: Ref<E, A>) => modifyRef(ref)(f)
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

/**
 * Creates a simple in-memory implementation of References
 */
export function createReferences(refs: Iterable<readonly [RefId, unknown]> = []): References {
  const references = new Map(refs)
  const [sendEvent, events] = create<RefEvent<unknown>>()

  function getRef<E, A>(ref: Ref<E, A>): E.Env<E, A> {
    const { id } = ref

    // If there's a value already just grab it
    if (references.has(id)) {
      return E.of(references.get(id)! as A)
    }

    return pipe(
      // Get the initial value
      ref.initial,
      // Set that value
      E.chainFirstIOK((value) => () => references.set(id, value)),
      // Send and event
      E.chainFirstIOK((value) => () => sendEvent({ type: 'created', id, value })),
    )
  }

  function hasRef<E, A>(ref: Ref<E, A>): E.Env<unknown, boolean> {
    return E.fromIO(() => references.has(ref.id))
  }

  function setRef<A>(value: A) {
    return <E>(ref: Ref<E, A>): E.Env<E, A> =>
      pipe(
        ref,
        getRef, // Get the current value
        E.chainFirstIOK(() => () => references.set(ref.id, value)), // Set the new value
        E.chainFirstIOK((previousValue) => () =>
          !pipe(value, ref.eq.equals(previousValue)) && // Compare them and send an updated event
          sendEvent({ type: 'updated', id: ref.id, previousValue, value }),
        ),
        E.map(() => value),
      )
  }

  function deleteRef<E, A>(ref: Ref<E, A>): E.Env<unknown, Option<A>> {
    const { id } = ref

    // If we don't have that id return None
    if (!references.has(id)) {
      return E.of(none)
    }

    // Get the current value to return later
    const value = some(references.get(id)! as A)

    return pipe(
      // Delete the reference
      E.fromIO(() => references.delete(id)),
      // Send an event
      E.chainFirstIOK(() => () => sendEvent({ type: 'deleted', id })),
      // Return the previously set value`
      E.map(() => value),
    )
  }

  return {
    events,
    sendEvent,
    getRef,
    hasRef,
    setRef,
    deleteRef,
    clone: sync(() => some(createReferences([...references]))),
  }
}

export interface WrappedRef<R, E, A> extends Ref<E, A> {
  readonly get: E.Env<E & R, A>
  readonly has: E.Env<E & R, boolean>
  readonly set: (value: A) => E.Env<E & R, A>
  readonly modify: (f: Arity1<A, A>) => E.Env<E & R, A>
  readonly delete: E.Env<R, Option<A>>
}

export interface URef<E, A> extends WrappedRef<unknown, E, A> {}

export function wrapRef<E, A>(ref: Ref<E, A>): WrappedRef<Refs, E, A> {
  return {
    ...ref,
    get: getRef(ref),
    has: hasRef(ref),
    set: setRef(ref),
    modify: modifyRef(ref),
    delete: deleteRef(ref),
  } as const
}

export const createRef = flow(makeRef, wrapRef)

export function fromKey<A>(eq: Eq<A> = deepEqualsEq) {
  return <K extends PropertyKey>(key: K): WrappedRef<Refs, Readonly<Record<K, A>>, A> =>
    createRef(
      E.fromReader((e: Readonly<Record<K, A>>) => e[key]),
      RefId(key),
      eq,
    )
}
