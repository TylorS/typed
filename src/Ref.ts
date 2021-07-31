/**
 * `Ref` is an abstraction for managing state-based applications using [Env](./Env.ts.md). It exposes an extensible
 * get/set/delete API for managing keys to values. Every `Ref` is connected to an `Env` that will
 * provide the default value lazily when first asked for or after being deleted previously.
 *
 * The provided implementation will also send events containing all of the creations/updates/deletes
 * occurring in real-time.
 *
 * Here's a small example of a Counter application to show how one might use Ref to create a simple
 * counter application.
 *
 * ```ts
 * import * as E from '@typed/fp/Env'
 * import * as RS from '@typed/fp/ReaderStream'
 * import * as Ref from '@typed/fp/Ref'
 * import * as S from '@typed/fp/Stream'
 * import * as U from '@typed/fp/use'
 * import { newDefaultScheduler } from '@most/scheduler'
 * import * as F from 'fp-ts/function'
 * import { html, render, Renderable } from 'uhtml'
 *
 * const rootElement: HTMLElement | null = document.getElementById('app')
 *
 * if (!rootElement) {
 *   throw new Error('Unable to find element by #app')
 * }
 *
 * // Creates a Reference to keep our Count
 * // It requires no resources and tracks a number
 * const Count: Ref.Reference<unknown, number> = Ref.create(E.of(0))
 *
 * // Actions to update our Count Reference - easily tested
 * const increment: E.Env<Ref.Refs, number> = Count.update(F.flow(F.increment, E.of))
 *
 * const decrement: E.Env<Ref.Refs, number> = Count.update(
 *   F.flow(
 *     F.decrement,
 *     E.of,
 *     E.map((x) => Math.max(0, x)),
 *   ),
 * )
 *
 * // Creates a component which represents our counter
 * const Counter: E.Env<Ref.Refs, Renderable> = F.pipe(
 *   E.Do,
 *   U.bindEnvK('dec', () => decrement),
 *   U.bindEnvK('inc', () => increment),
 *   E.bindW('count', () => Count.get),
 *   E.map(
 *     ({ dec, inc, count }) => html`<div>
 *       <button onclick=${dec}>Decrement</button>
 *       <span>Count: ${count}</span>
 *       <button onclick=${inc}>Increment</button>
 *     </div>`,
 *   ),
 * )
 *
 * const Main: RS.ReaderStream<Ref.Refs, HTMLElement> = F.pipe(
 *   Counter,
 *   Ref.sample, // Sample our Counter everytime there is a Ref update.
 *   RS.scan(render, rootElement), // Render our application using 'uhtml'
 * )
 *
 * // Provide Main with its required resources
 * const stream: S.Stream<HTMLElement> = Main(Ref.refs())
 *
 * // Execute our Stream with a default scheduler
 * S.runEffects(stream, newDefaultScheduler()).catch((error) => console.error(error))
 * ```
 *
 * It is likely worth noting that, by default, `Ref.make` is not referentially transparent. It will
 * automatically generate a unique `Symbol()` on each invocation for the `Ref.id`. If you need
 * referential transparency, be sure to provide your own `id`. This also applies to `Ref.create` and
 * the `Context.create`.
 *
 * ```ts
 * const myRef = Ref.make(initial, {
 *   id: 'MyId',
 * })
 * ```
 *
 * @since 0.9.2
 */
import { Eq } from 'fp-ts/Eq'
import { flow, pipe } from 'fp-ts/function'
import { not } from 'fp-ts/Refinement'
import { fst, snd } from 'fp-ts/Tuple2'
import { Cast } from 'ts-toolbelt/out/Any/Cast'

import * as A from './Adapter'
import * as E from './Env'
import { deepEqualsEq } from './Eq'
import { Intersect } from './HKT'
import * as O from './Option'
import * as P from './Provide'
import * as RS from './ReaderStream'

/**
 * @since 0.9.2
 * @category Model
 */
export interface Ref<E, A> extends Eq<A> {
  readonly id: PropertyKey
  readonly initial: E.Env<E, A>
}

/**
 * @since 0.9.2
 * @category Model
 */
export interface Of<A> extends Ref<unknown, A> {}

/**
 * @since 0.9.2
 * @category Type-level
 */
export type EnvOf<A> = [A] extends [Ref<infer R, any>] ? R : never

/**
 * @since 0.9.2
 * @category Type-level
 */
export type ValueOf<A> = [A] extends [Ref<any, infer R>] ? R : never

/**
 * @since 0.9.2
 * @category Options
 */
export type RefOptions<A> = {
  readonly eq?: Eq<A>
  readonly id?: PropertyKey
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export function make<E, A>(initial: E.Env<E, A>, options: RefOptions<A> = {}): Ref<E, A> {
  const { eq = deepEqualsEq, id = Symbol() } = options

  return {
    id,
    initial,
    equals: eq.equals,
  }
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const get = <E, A>(ref: Ref<E, A>) => E.asksE((e: Get) => e.getRef(ref))

/**
 * @since 0.9.2
 * @category Environment
 */
export interface Get {
  readonly getRef: <E, A>(ref: Ref<E, A>) => E.Env<E, A>
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const has = <E, A>(ref: Ref<E, A>) => E.asksE((e: Has) => e.hasRef(ref))

/**
 * @since 0.9.2
 * @category Environment
 */
export interface Has {
  readonly hasRef: <E, A>(ref: Ref<E, A>) => E.Of<boolean>
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const set =
  <E, A>(ref: Ref<E, A>) =>
  (value: A) =>
    E.asksE((e: Set) => e.setRef(ref, value))

/**
 * @since 0.9.2
 * @category Environment
 */
export interface Set {
  readonly setRef: <E, A>(ref: Ref<E, A>, value: A) => E.Env<E, A>
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const update =
  <E1, A>(ref: Ref<E1, A>) =>
  <E2>(f: (value: A) => E.Env<E2, A>) =>
    pipe(ref, get, E.chainW(f), E.chainW(set(ref)))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const remove = <E, A>(ref: Ref<E, A>) => E.asksE((e: Remove) => e.removeRef(ref))

/**
 * @since 0.9.2
 * @category Environment
 */
export interface Remove {
  readonly removeRef: <E, A>(ref: Ref<E, A>) => E.Env<E, O.Option<A>>
}

/**
 * @since 0.9.2
 * @category Environment
 */
export interface Events {
  readonly refEvents: Adapter
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const getAdapter = E.asks((e: Events) => e.refEvents)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const getSendEvent = pipe(getAdapter, E.map(fst))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const sendEvent = <E, A>(event: Event<E, A>) => pipe(getSendEvent, E.apW(E.of(event)))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const getRefEvents: RS.ReaderStream<Events, Event<any, any>> = (e: Events) =>
  snd(e.refEvents)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const listenTo = <E, A>(ref: Ref<E, A>): RS.ReaderStream<Events, Event<E, A>> =>
  pipe(
    getRefEvents,
    RS.filter((x) => x.ref.id === ref.id),
  )

/**
 * @since 0.9.2
 * @category Combinator
 */
export const listenToValues = <E, A>(ref: Ref<E, A>): RS.ReaderStream<E & Events, O.Option<A>> =>
  pipe(
    ref,
    listenTo,
    RS.map((e) => (isRemoved(e) ? O.none : O.some(e.value))),
  )

/**
 * @since 0.9.2
 * @category Environment
 */
export interface ParentRefs {
  readonly parentRefs: O.Option<Refs>
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const getParentRefs = E.asks((e: ParentRefs) => e.parentRefs)

/**
 * @since 0.9.2
 * @category Environment
 */
export type Refs = Get & Has & Set & Remove & Events & ParentRefs

/**
 * @since 0.9.2
 * @category Combinator
 */
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

/**
 * @since 0.9.2
 * @category Model
 */
export interface Reference<E, A> extends Ref<E, A> {
  readonly get: E.Env<E & Refs, A>
  readonly has: E.Env<Refs, boolean>
  readonly set: (value: A) => E.Env<E & Refs, A>
  readonly update: <E2>(f: (value: A) => E.Env<E2, A>) => E.Env<E & E2 & Refs, A>
  readonly remove: E.Env<E & Refs, O.Option<A>>
  readonly listen: RS.ReaderStream<Refs, Event<E, A>>
  readonly values: RS.ReaderStream<E & Refs, O.Option<A>>
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export function toReference<E, A>(ref: Ref<E, A>): Reference<E, A> {
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

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideSome =
  <E1>(provided: E1) =>
  <E2, A>(ref: Reference<E1 & E2, A>): Reference<E2, A> => {
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

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideAll: <E>(provided: E) => <A>(ref: Reference<E, A>) => Reference<unknown, A> =
  provideSome

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useSome =
  <E1>(provided: E1) =>
  <E2, A>(ref: Reference<E1 & E2, A>): Reference<E2, A> => {
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

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useAll: <E1>(provided: E1) => <A>(ref: Reference<E1, A>) => Reference<unknown, A> =
  useSome

/**
 * @since 0.9.2
 * @category URI
 */
export const URI = '@typed/fp/Ref'
/**
 * @since 0.9.2
 * @category URI
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: Reference<E, A>
  }
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseSome: P.UseSome2<URI> = {
  useSome,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseAll: P.UseAll2<URI> = {
  useAll,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideSome: P.ProvideSome2<URI> = {
  provideSome,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideAll: P.ProvideAll2<URI> = {
  provideAll,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Provide: P.Provide2<URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const create = flow(make, toReference)

/**
 * @since 0.9.2
 * @category Model
 */
export type Adapter = A.Adapter<Event<any, any>>

/**
 * @since 0.9.2
 * @category Model
 */
export type Event<E, A> = Created<E, A> | Updated<E, A> | Removed<E, A>

/**
 * @since 0.9.2
 * @category Model
 */
export interface Created<E, A> {
  readonly _tag: 'Created'
  readonly ref: Ref<E, A>
  readonly value: A
  readonly refs: O.Option<Refs>
}

/**
 * @since 0.9.2
 * @category Refinement
 */
export const isCreated = <E, A>(event: Event<E, A>): event is Created<E, A> =>
  event._tag === 'Created'

/**
 * @since 0.9.2
 * @category Model
 */
export interface Updated<E, A> {
  readonly _tag: 'Updated'
  readonly ref: Ref<E, A>
  readonly previousValue: A
  readonly value: A
  readonly refs: O.Option<Refs>
}

/**
 * @since 0.9.2
 * @category Refinement
 */
export const isUpdated = <E, A>(event: Event<E, A>): event is Updated<E, A> =>
  event._tag === 'Updated'

/**
 * @since 0.9.2
 * @category Model
 */
export interface Removed<E, A> {
  readonly _tag: 'Removed'
  readonly ref: Ref<E, A>
  readonly refs: O.Option<Refs>
}

/**
 * @since 0.9.2
 * @category Refinement
 */
export const isRemoved = <E, A>(event: Event<E, A>): event is Removed<E, A> =>
  event._tag === 'Removed'

/**
 * @since 0.9.2
 * @category Deconstructor
 */
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

/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const match: <A, B, C>(
  onCreated: (value: A, ref: Ref<B, A>) => C,
  onUpdated: (previousValue: A, value: A, ref: Ref<B, A>) => C,
  onDeleted: (ref: Ref<B, A>) => C,
) => (event: Event<B, A>) => C = matchW

/**
 * @since 0.9.2
 * @category Environment Constructor
 */
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

/**
 * @since 0.9.2
 * @category Options
 */
export type RefsOptions = {
  readonly initial?: Iterable<readonly [any, any]>
  readonly refEvents?: Adapter
  readonly parentRefs?: Refs
}

function createSendEvent(references: Map<any, any>, [push]: Adapter) {
  const updateReferences = (event: Event<any, any>) => {
    if (event._tag === 'Created' || event._tag === 'Updated') {
      references.set(event.ref.id, event.value)

      return
    }

    references.delete(event.ref.id)
  }

  const sendEvent = (event: Event<any, any>) => {
    if (event._tag === 'Created' || event._tag === 'Removed') {
      return push(event)
    }

    // Only send update events when they have changed
    if (!event.ref.equals(event.previousValue)(event.value)) {
      return push(event)
    }
  }

  return (event: Event<any, any>) =>
    pipe(
      event.refs,
      O.matchW(
        // Only update our local references when event.refs is None
        // as this indicates the event originates from within our current Refs environment.
        () => {
          updateReferences(event)
          sendEvent(event)
        },
        // When event.refs is Some<Refs>, the event originated from another set of references.
        // We only replicate the event such that a descendant Refs can be re-sampled when it subscribes to
        // a Ref from an Ancestor's environment.
        () => sendEvent(event),
      ),
    )
}

function makeGetRef(references: Map<any, any>, sendEvent: (event: Event<any, any>) => void): Get {
  return {
    getRef(ref) {
      if (references.has(ref.id)) {
        return E.of(references.get(ref.id)!)
      }

      return pipe(
        ref.initial,
        E.chainFirstIOK((value) => () => sendEvent({ _tag: 'Created', ref, value, refs: O.none })),
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
          (previousValue) => () =>
            sendEvent({ _tag: 'Updated', ref, previousValue, value, refs: O.none }),
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
        E.chainFirstIOK(() => () => sendEvent({ _tag: 'Removed', ref, refs: O.none })),
      )
    },
  }
}

/**
 * Creates a union of Envs for all the possible combinations for Ref environments.
 * @since 0.9.2
 * @category Type-level
 */
export type Env<E, A> =
  | E.Env<E, A>
  | GetEnv<CombinationsOf<E, [Get, Has, Set, Remove, Events, ParentRefs]>, A>

/**
 * Creates a union of ReaderStreams for all the possible combinations for Ref environments.
 * @since 0.9.2
 * @category Type-level
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
 * @since 0.9.2
 * @category Combinator
 */
export const sample = <E, A>(env: Env<E, A>): RS.ReaderStream<E & Refs, A> =>
  pipe(
    getRefEvents,
    RS.filter(not(isCreated)),
    RS.startWith(null),
    RS.exhaustMapLatestEnv(() => env),
  )
