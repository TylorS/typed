import * as E from '@fp/Env'
import { deepEqualsEq } from '@fp/Eq'
import { Do } from '@fp/Fx/Env'
import * as O from '@fp/Option'
import { Eq } from 'fp-ts/Eq'
import { flow, pipe } from 'fp-ts/function'

import * as A from './Adapter'

export interface Ref<E, A> extends Eq<A> {
  readonly id: PropertyKey
  readonly initial: E.Env<E, A>
}

export interface Of<A> extends Ref<{}, A> {}

export function make<E, A>(
  initial: E.Env<E, A>,
  id: PropertyKey = Symbol(),
  eq: Eq<A> = deepEqualsEq,
): Ref<E, A> {
  return {
    id,
    initial,
    equals: eq.equals,
  }
}

export const get = <E, A>(ref: Ref<E, A>) => E.asksE((e: Get) => e.getRef(ref))

export interface Get {
  readonly getRef: <E, A>(ref: Ref<E, A>) => E.Env<E, A>
}

export const has = <E, A>(ref: Ref<E, A>) => E.asksE((e: Has) => e.hasRef(ref))

export interface Has {
  readonly hasRef: <E, A>(ref: Ref<E, A>) => E.Of<boolean>
}

export const set =
  <E, A>(ref: Ref<E, A>) =>
  (value: A) =>
    E.asksE((e: Set) => e.setRef(ref, value))

export interface Set {
  readonly setRef: <E, A>(ref: Ref<E, A>, value: A) => E.Env<E, A>
}

export const update =
  <E1, A>(ref: Ref<E1, A>) =>
  <E2>(f: (value: A) => E.Env<E2, A>) =>
    Do(function* (_) {
      const current = yield* _(get(ref))
      const updated = yield* _(f(current))

      return yield* _(set(ref)(updated))
    })

export const remove = <E, A>(ref: Ref<E, A>) => E.asksE((e: Remove) => e.removeRef(ref))

export interface Remove {
  readonly removeRef: <E, A>(ref: Ref<E, A>) => E.Env<E, O.Option<A>>
}

export interface Events {
  readonly refEvents: Adapter
}

export type Refs = Get & Has & Set & Remove & Events

export interface Wrapped<E, A, R = unknown> extends Ref<E, A> {
  readonly get: E.Env<R & E & Get, A>
  readonly has: E.Env<R & Has, boolean>
  readonly set: (value: A) => E.Env<R & E & Set, A>
  readonly update: <E2>(f: (value: A) => E.Env<E2, A>) => E.Env<R & E & Get & E2 & Set, A>
  readonly remove: E.Env<R & E & Remove, O.Option<A>>
}

export function wrap<E, A>(ref: Ref<E, A>): Wrapped<E, A> {
  return {
    ...ref,
    get: get(ref),
    has: has(ref),
    set: set(ref),
    update: update(ref),
    remove: remove(ref),
  } as const
}

export const create = flow(make, wrap)

export type Adapter = A.Adapter<Event<any, any>>

export type Event<E, A> = Created<E, A> | Updated<E, A> | Removed<E, A>

export interface Created<E, A> {
  readonly _tag: 'Created'
  readonly ref: Ref<E, A>
  readonly value: A
}

export interface Updated<E, A> {
  readonly _tag: 'Updated'
  readonly ref: Ref<E, A>
  readonly previousValue: A
  readonly value: A
}

export interface Removed<E, A> {
  readonly _tag: 'Removed'
  readonly ref: Ref<E, A>
}

export function refs(options: RefsOptions = {}): Refs {
  const { initial = [], adapter = A.create() } = options
  const references = new Map(initial)
  const sendEvent = createSendEvent(references, adapter)

  return {
    ...makeGetRef(references, sendEvent),
    ...makeHasRef(references),
    ...makeSetRef(references, sendEvent),
    ...makeDeleteRef(references, sendEvent),
    refEvents: adapter,
  }
}

export type RefsOptions = {
  readonly initial?: Iterable<readonly [any, any]>
  readonly adapter?: Adapter
}

function createSendEvent(references: Map<any, any>, [push]: Adapter) {
  const handleEvent = (event: Event<any, any>) => {
    switch (event._tag) {
      case 'Created':
      case 'Updated':
        return references.set(event.ref.id, event.value)
      case 'Removed':
        return references.delete(event.ref.id)
    }
  }

  const sendEvent = (event: Event<any, any>): void => {
    handleEvent(event)
    push(event)
  }

  return sendEvent
}

function makeGetRef(references: Map<any, any>, sendEvent: (event: Event<any, any>) => void): Get {
  return {
    getRef(ref) {
      if (references.has(ref.id)) {
        return E.of(references.get(ref.id)!)
      }

      return pipe(
        ref.initial,
        E.chainFirstIOK((value) => () => sendEvent({ _tag: 'Created', ref, value })),
      )
    },
  }
}

function makeHasRef(references: Map<any, any>): Has {
  return {
    hasRef(ref) {
      return E.fromIO(() => references.has(ref.id))
    },
  }
}

function makeSetRef(references: Map<any, any>, sendEvent: (event: Event<any, any>) => void): Set {
  const { getRef } = makeGetRef(references, sendEvent)

  return {
    setRef(ref, value) {
      return pipe(
        getRef(ref),
        E.chainFirstIOK(
          (previousValue) => () => sendEvent({ _tag: 'Updated', ref, previousValue, value }),
        ),
        E.constant(value),
      )
    },
  }
}

function makeDeleteRef(
  references: Map<any, any>,
  sendEvent: (event: Event<any, any>) => void,
): Remove {
  return {
    removeRef(ref) {
      return pipe(
        E.fromIO(() => O.fromNullable(references.get(ref.id))),
        E.chainFirstIOK(() => () => sendEvent({ _tag: 'Removed', ref })),
      )
    },
  }
}
