import { Eq } from 'fp-ts/Eq'
import { flow, pipe } from 'fp-ts/function'
import { not } from 'fp-ts/Refinement'
import { fst, snd } from 'fp-ts/Tuple2'
import { Cast } from 'ts-toolbelt/out/Any/Cast'

import * as A from './Adapter'
import * as E from './Env'
import { deepEqualsEq } from './Eq'
import { Intersect } from './Hkt'
import * as O from './Option'
import * as P from './Provide'
import * as RS from './ReaderStream'

export interface Ref<E, A> extends Eq<A> {
  readonly id: PropertyKey
  readonly initial: E.Env<E, A>
}

export interface Of<A> extends Ref<unknown, A> {}

export type EnvOf<A> = [A] extends [Ref<infer R, any>] ? R : never

export type ValueOf<A> = [A] extends [Ref<any, infer R>] ? R : never

export type RefOptions<A> = {
  readonly eq?: Eq<A>
  readonly id?: PropertyKey
}

export function make<E, A>(initial: E.Env<E, A>, options: RefOptions<A> = {}): Ref<E, A> {
  const { eq = deepEqualsEq, id = Symbol() } = options

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
    pipe(ref, get, E.chainW(f), E.chainW(set(ref)))

export const remove = <E, A>(ref: Ref<E, A>) => E.asksE((e: Remove) => e.removeRef(ref))

export interface Remove {
  readonly removeRef: <E, A>(ref: Ref<E, A>) => E.Env<E, O.Option<A>>
}

export interface Events {
  readonly refEvents: Adapter
}

export const getAdapter = E.asks((e: Events) => e.refEvents)

export const getSendEvent = pipe(getAdapter, E.map(fst))

export const sendEvent = <E, A>(event: Event<E, A>) => pipe(getSendEvent, E.apW(E.of(event)))

export const getRefEvents: RS.ReaderStream<Events, Event<any, any>> = (e: Events) =>
  snd(e.refEvents)

export const listenTo = <E, A>(ref: Ref<E, A>): RS.ReaderStream<Events, Event<E, A>> =>
  pipe(
    getRefEvents,
    RS.filter((x) => x.ref.id === ref.id),
  )

export const listenToValues = <E, A>(ref: Ref<E, A>): RS.ReaderStream<E & Get & Events, A> =>
  pipe(
    getRefEvents,
    RS.filter((x): x is Event<E, A> => x.ref.id === ref.id),
    RS.filter(not(isRemoved)),
    RS.map((e) => e.value),
    RS.merge(RS.fromEnv(get(ref))),
  )

export interface ParentRefs {
  readonly parentRefs: O.Option<Refs>
}

export const getParentRefs = E.asks((e: ParentRefs) => e.parentRefs)

export type Refs = Get & Has & Set & Remove & Events & ParentRefs

export const getRefs = E.asks(
  ({ getRef, hasRef, setRef, removeRef, refEvents, parentRefs }: Refs): Refs => ({
    getRef,
    hasRef,
    setRef,
    removeRef,
    refEvents,
    parentRefs,
  }),
)

export interface Wrapped<E, A> extends Ref<E, A> {
  readonly get: E.Env<E & Refs, A>
  readonly has: E.Env<Refs, boolean>
  readonly set: (value: A) => E.Env<E & Refs, A>
  readonly update: <E2>(f: (value: A) => E.Env<E2, A>) => E.Env<E & E2 & Refs, A>
  readonly remove: E.Env<E & Refs, O.Option<A>>
  readonly listen: RS.ReaderStream<Refs, Event<E, A>>
  readonly values: RS.ReaderStream<E & Refs, A>
}

export function wrap<E, A>(ref: Ref<E, A>): Wrapped<E, A> {
  return {
    id: ref.id,
    initial: ref.initial,
    equals: ref.equals,
    get: get(ref),
    has: has(ref),
    set: set(ref),
    update: update(ref),
    remove: remove(ref),
    listen: listenTo(ref),
    values: listenToValues(ref),
  } as const
}

export const provideSome =
  <E1>(provided: E1) =>
  <E2, A>(ref: Wrapped<E1 & E2, A>): Wrapped<E2, A> => {
    return {
      id: ref.id,
      equals: ref.equals,
      initial: pipe(ref.initial, E.provideSome(provided)),
      get: pipe(ref.get, E.provideSome(provided)),
      has: pipe(ref.has, E.provideSome(provided)),
      set: flow(ref.set, E.provideSome(provided)),
      update: flow(ref.update, E.provideSome(provided)),
      remove: pipe(ref.remove, E.provideSome(provided)),
      listen: pipe(ref.listen, RS.provideSome(provided)),
      values: pipe(ref.values, RS.provideSome(provided)),
    }
  }

export const provideAll: <E>(provided: E) => <A>(ref: Wrapped<E, A>) => Wrapped<unknown, A> =
  provideSome

export const useSome =
  <E1>(provided: E1) =>
  <E2, A>(ref: Wrapped<E1 & E2, A>): Wrapped<E2, A> => {
    return {
      id: ref.id,
      equals: ref.equals,
      initial: pipe(ref.initial, E.useSome(provided)),
      get: pipe(ref.get, E.useSome(provided)),
      has: pipe(ref.has, E.useSome(provided)),
      set: flow(ref.set, E.useSome(provided)),
      update: flow(ref.update, E.useSome(provided)),
      remove: pipe(ref.remove, E.useSome(provided)),
      listen: pipe(ref.listen, RS.useSome(provided)),
      values: pipe(ref.values, RS.useSome(provided)),
    }
  }

export const useAll: <E1>(provided: E1) => <A>(ref: Wrapped<E1, A>) => Wrapped<unknown, A> = useSome

export const WrappedURI = '@typed/fp/Ref'
export type WrappedURI = typeof WrappedURI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [WrappedURI]: Wrapped<E, A>
  }
}

export const UseSome: P.UseSome2<WrappedURI> = {
  useSome,
}

export const UseAll: P.UseAll2<WrappedURI> = {
  useAll,
}

export const ProvideSome: P.ProvideSome2<WrappedURI> = {
  provideSome,
}

export const ProvideAll: P.ProvideAll2<WrappedURI> = {
  provideAll,
}

export const Provide: P.Provide2<WrappedURI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}

export const create = flow(make, wrap)

export type Adapter = A.Adapter<Event<any, any>>

export type Event<E, A> = Created<E, A> | Updated<E, A> | Removed<E, A>

export interface Created<E, A> {
  readonly _tag: 'Created'
  readonly ref: Ref<E, A>
  readonly value: A
}

export const isCreated = <E, A>(event: Event<E, A>): event is Created<E, A> =>
  event._tag === 'Created'

export interface Updated<E, A> {
  readonly _tag: 'Updated'
  readonly ref: Ref<E, A>
  readonly previousValue: A
  readonly value: A
}

export const isUpdated = <E, A>(event: Event<E, A>): event is Updated<E, A> =>
  event._tag === 'Updated'

export interface Removed<E, A> {
  readonly _tag: 'Removed'
  readonly ref: Ref<E, A>
}

export const isRemoved = <E, A>(event: Event<E, A>): event is Removed<E, A> =>
  event._tag === 'Removed'

export const matchW =
  <A, B, C, D, E>(
    onCreated: (value: A, ref: Ref<B, A>) => C,
    onUpdated: (previousValue: A, value: A, ref: Ref<B, A>) => D,
    onDeleted: (ref: Ref<B, A>) => E,
  ) =>
  (event: Event<B, A>): C | D | E => {
    if (event._tag === 'Updated') {
      return onUpdated(event.previousValue, event.value, event.ref)
    }

    if (event._tag === 'Created') {
      return onCreated(event.value, event.ref)
    }

    return onDeleted(event.ref)
  }

export const match: <A, B, C>(
  onCreated: (value: A, ref: Ref<B, A>) => C,
  onUpdated: (previousValue: A, value: A, ref: Ref<B, A>) => C,
  onDeleted: (ref: Ref<B, A>) => C,
) => (event: Event<B, A>) => C = matchW

export function refs(options: RefsOptions = {}): Refs {
  const { initial = [], refEvents = A.create() } = options
  const references = new Map(initial)
  const sendEvent = createSendEvent(references, refEvents)

  return {
    ...makeGetRef(references, sendEvent),
    ...makeHasRef(references),
    ...makeSetRef(references, sendEvent),
    ...makeDeleteRef(references, sendEvent),
    parentRefs: O.fromNullable(options.parentRefs),
    refEvents: [sendEvent, refEvents[1]],
  }
}

export type RefsOptions = {
  readonly initial?: Iterable<readonly [any, any]>
  readonly refEvents?: Adapter
  readonly parentRefs?: Refs
}

function createSendEvent(references: Map<any, any>, [push]: Adapter) {
  return (event: Event<any, any>) => {
    switch (event._tag) {
      case 'Created':
        references.set(event.ref.id, event.value)
        push(event)
        break
      case 'Updated':
        references.set(event.ref.id, event.value)

        if (!event.ref.equals(event.previousValue)(event.value)) {
          push(event)
        }
        break
      case 'Removed':
        references.delete(event.ref.id)
        push(event)
        break
    }
  }
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
        ref,
        getRef,
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
        E.fromIO(() => (references.has(ref.id) ? O.some(references.get(ref.id)) : O.none)),
        E.chainFirstIOK(() => () => sendEvent({ _tag: 'Removed', ref })),
      )
    },
  }
}

/**
 * Creates a union of Envs for all the possible combinations for Ref environments.
 */
export type Env<E, A> =
  | E.Env<E, A>
  | GetEnv<CombinationsOf<E, [Get, Has, Set, Remove, Events, ParentRefs]>, A>

/**
 * Creates a union of ReaderStreams for all the possible combinations for Ref environments.
 */
export type ReaderStream<E, A> =
  | RS.ReaderStream<E, A>
  | GetReaderStream<CombinationsOf<E, [Get, Has, Set, Remove, Events, ParentRefs]>, A>

type CombinationsOf<E, A extends readonly any[]> = A extends readonly [infer S1, ...infer SS]
  ? GetCombinationsOf<E, S1, SS>
  : readonly []

type GetCombinationsOf<
  E,
  S1,
  SS extends readonly any[],
  C extends ReadonlyArray<ReadonlyArray<any>> = CombinationsOf<E, SS>,
> = SS extends readonly []
  ? readonly [readonly [E, S1], ...C]
  : readonly [
      readonly [E, S1],
      ...{
        readonly [K in keyof C]: readonly [S1, ...Cast<C[K], readonly any[]>]
      },
      ...C
    ]

type GetEnv<Combos extends ReadonlyArray<ReadonlyArray<any>>, A> = {
  readonly [K in keyof Combos]: E.Env<Intersect<Cast<Combos[K], readonly any[]>>, A>
}[number]

type GetReaderStream<Combos extends ReadonlyArray<ReadonlyArray<any>>, A> = {
  readonly [K in keyof Combos]: RS.ReaderStream<Intersect<Cast<Combos[K], readonly any[]>>, A>
}[number]

/**
 * Sample an Env with the latest references when updates have occured.
 */
export const sample = <E, A>(env: Env<E, A>): RS.ReaderStream<E & Refs, A> =>
  pipe(
    getRefEvents,
    RS.filter(not(isCreated)),
    RS.startWith(null),
    RS.exhaustMapLatestEnv(() => env),
  )
