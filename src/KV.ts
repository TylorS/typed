/**
 * `KV` is an abstraction for managing state-based applications using [Env](./Env.ts.md). It exposes an extensible
 * get/set/delete API for managing keys to values. Every `KV` is connected to an `Env` that will
 * provide the default value lazily when first asked for or after being deleted previously.
 *
 * The provided implementation will also send events containing all of the creations/updates/deletes
 * occurring in real-time.
 * @since 0.11.0
 */
import { Eq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'
import { not } from 'fp-ts/Refinement'
import { fst, snd } from 'fp-ts/Tuple2'
import { Cast } from 'ts-toolbelt/out/Any/Cast'

import * as A from './Adapter'
import * as E from './Env'
import * as EE from './EnvEither'
import { deepEqualsEq } from './Eq'
import { Intersect } from './HKT'
import * as O from './Option'
import * as RS from './ReaderStream'

/**
 * @since 0.11.0
 * @category Model
 */
export interface KV<E, A> extends Eq<A> {
  readonly key: string
  readonly initial: E.Env<E, A>
}

/**
 * @since 0.11.0
 * @category Model
 */
export interface Of<A> extends KV<unknown, A> {}

/**
 * @since 0.11.0
 * @category Type-level
 */
export type EnvOf<A> = [A] extends [KV<infer R, any>] ? R : never

/**
 * @since 0.11.0
 * @category Type-level
 */
export type ValueOf<A> = [A] extends [KV<any, infer R>] ? R : never

/**
 * @since 0.11.0
 * @category Options
 */
export type KVOptions<A> = {
  readonly eq?: Eq<A>
  readonly key?: string
}

let currentId = 0
const nextId = () => `${currentId++}`

/**
 * @since 0.11.0
 * @category Constructor
 */
export function make<E, A>(initial: E.Env<E, A>, options: KVOptions<A> = {}): KV<E, A> {
  const { eq = deepEqualsEq, key = nextId() } = options

  return {
    key,
    initial,
    equals: eq.equals,
  }
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const get = <E, A>(KV: KV<E, A>) => E.asksE((e: Get) => e.getKV(KV))

/**
 * @since 0.11.0
 * @category Environment
 */
export interface Get {
  readonly getKV: <E, A>(KV: KV<E, A>) => E.Env<E, A>
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const has = <E, A>(KV: KV<E, A>) => E.asksE((e: Has) => e.hasKV(KV))

/**
 * @since 0.11.0
 * @category Environment
 */
export interface Has {
  readonly hasKV: <E, A>(KV: KV<E, A>) => E.Of<boolean>
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const set =
  <E, A>(KV: KV<E, A>) =>
  (value: A) =>
    E.asksE((e: Set) => e.setKV(KV, value))

/**
 * @since 0.11.0
 * @category Environment
 */
export interface Set {
  readonly setKV: <E, A>(KV: KV<E, A>, value: A) => E.Env<E, A>
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const update =
  <E1, A>(KV: KV<E1, A>) =>
  <E2>(f: (value: A) => E.Env<E2, A>) =>
    pipe(KV, get, E.chainW(f), E.chainW(set(KV)))

/**
 * @since 0.11.0
 * @category Combinator
 */
export const remove = <E, A>(KV: KV<E, A>) => E.asksE((e: Remove) => e.removeKV(KV))

/**
 * @since 0.11.0
 * @category Environment
 */
export interface Remove {
  readonly removeKV: <E, A>(KV: KV<E, A>) => E.Env<E, O.Option<A>>
}

/**
 * @since 0.11.0
 * @category Environment
 */
export interface Events {
  readonly kvEvents: Adapter
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const getAdapter = E.asks((e: Events) => e.kvEvents)

/**
 * @since 0.11.0
 * @category Combinator
 */
export const getSendEvent = pipe(getAdapter, E.map(fst))

/**
 * @since 0.11.0
 * @category Combinator
 */
export const sendEvent = <E, A>(event: Event<E, A>) => pipe(getSendEvent, E.apW(E.of(event)))

/**
 * @since 0.11.0
 * @category Combinator
 */
export const getKVEvents: RS.ReaderStream<Events, Event<any, any>> = (e: Events) => snd(e.kvEvents)

/**
 * @since 0.11.0
 * @category Combinator
 */
export const listenTo = <E, A>(KV: KV<E, A>): RS.ReaderStream<Events, Event<E, A>> =>
  pipe(
    getKVEvents,
    RS.filter((x) => x.kv.key === KV.key),
  )

/**
 * @since 0.11.0
 * @category Combinator
 */
export const listenToValues = <E, A>(KV: KV<E, A>): RS.ReaderStream<E & Events, O.Option<A>> =>
  pipe(
    KV,
    listenTo,
    RS.map((e) => (isRemoved(e) ? O.none : O.some(e.value))),
    RS.startWith(O.none),
  )

/**
 * @since 0.11.0
 * @category Environment
 */
export interface ParentKVEnv {
  readonly parentKVEnv: O.Option<KVEnv>
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const getParentKVs = E.asks((e: ParentKVEnv) => e.parentKVEnv)

/**
 * @since 0.11.0
 * @category Environment
 */
export type KVEnv = Get & Has & Set & Remove & Events & ParentKVEnv

/**
 * @since 0.11.0
 * @category Combinator
 */
export const getKVEnv = E.asks(
  ({ getKV, hasKV, setKV, removeKV, kvEvents, parentKVEnv: parentKVs }: KVEnv): KVEnv => ({
    getKV,
    hasKV,
    setKV,
    removeKV,
    kvEvents,
    parentKVEnv: parentKVs,
  }),
)

/**
 * @since 0.11.0
 * @category Model
 */
export type Adapter = A.Adapter<Event<any, any>>

/**
 * @since 0.11.0
 * @category Model
 */
export type Event<E, A> = Created<E, A> | Updated<E, A> | Removed<E, A>

/**
 * @since 0.11.0
 * @category Model
 */
export interface Created<E, A> {
  readonly _tag: 'Created'
  readonly kv: KV<E, A>
  readonly value: A
  readonly env: O.Option<KVEnv>
}

/**
 * @since 0.11.0
 * @category Refinement
 */
export const isCreated = <E, A>(event: Event<E, A>): event is Created<E, A> =>
  event._tag === 'Created'

/**
 * @since 0.11.0
 * @category Model
 */
export interface Updated<E, A> {
  readonly _tag: 'Updated'
  readonly kv: KV<E, A>
  readonly previousValue: A
  readonly value: A
  readonly env: O.Option<KVEnv>
}

/**
 * @since 0.11.0
 * @category Refinement
 */
export const isUpdated = <E, A>(event: Event<E, A>): event is Updated<E, A> =>
  event._tag === 'Updated'

/**
 * @since 0.11.0
 * @category Model
 */
export interface Removed<E, A> {
  readonly _tag: 'Removed'
  readonly kv: KV<E, A>
  readonly env: O.Option<KVEnv>
}

/**
 * @since 0.11.0
 * @category Refinement
 */
export const isRemoved = <E, A>(event: Event<E, A>): event is Removed<E, A> =>
  event._tag === 'Removed'

/**
 * @since 0.11.0
 * @category Deconstructor
 */
export const matchW =
  <A, B, C, D, E>(
    onCreated: (value: A, kv: KV<B, A>) => C,
    onUpdated: (previousValue: A, value: A, kv: KV<B, A>) => D,
    onDeleted: (kv: KV<B, A>) => E,
  ) =>
  (event: Event<B, A>): C | D | E => {
    if (event._tag === 'Updated') {
      return onUpdated(event.previousValue, event.value, event.kv)
    }

    if (event._tag === 'Created') {
      return onCreated(event.value, event.kv)
    }

    return onDeleted(event.kv)
  }

/**
 * @since 0.11.0
 * @category Deconstructor
 */
export const match: <A, B, C>(
  onCreated: (value: A, kv: KV<B, A>) => C,
  onUpdated: (previousValue: A, value: A, kv: KV<B, A>) => C,
  onDeleted: (kv: KV<B, A>) => C,
) => (event: Event<B, A>) => C = matchW

/**
 * @since 0.11.0
 * @category Environment Constructor
 */
export function env(options: EnvOptions = {}): KVEnv {
  const { initial = [], kvEvents: refEvents = A.create() } = options
  const references = new Map(initial)
  const sendEvent = createSendEvent(references, refEvents)

  return {
    ...makeGetKV(references, sendEvent),
    ...makeHasKV(references),
    ...makeSetKV(references, sendEvent),
    ...makeDeleteKV(references, sendEvent),
    parentKVEnv: O.fromNullable(options.parentKVEnv),
    kvEvents: [sendEvent, refEvents[1]],
  }
}

/**
 * @since 0.11.0
 * @category Options
 */
export type EnvOptions = {
  readonly initial?: Iterable<readonly [any, any]>
  readonly kvEvents?: Adapter
  readonly parentKVEnv?: KVEnv
}

function createSendEvent(references: Map<any, any>, [push]: Adapter) {
  const updateReferences = (event: Event<any, any>) => {
    if (event._tag === 'Created' || event._tag === 'Updated') {
      references.set(event.kv.key, event.value)

      return
    }

    references.delete(event.kv.key)
  }

  const sendEvent = (event: Event<any, any>) => {
    if (event._tag === 'Created' || event._tag === 'Removed') {
      return push(event)
    }

    // Only send update events when they have changed
    if (!event.kv.equals(event.previousValue)(event.value)) {
      return push(event)
    }
  }

  return (event: Event<any, any>) =>
    pipe(
      event.env,
      O.matchW(
        // Only update our local references when event.env is None
        // as this indicates the event originates from within our current KVEnv environment.
        () => {
          updateReferences(event)
          sendEvent(event)
        },
        // When event.env is Some<KVEnv>, the event originated from another set of references.
        // We only replicate the event such that a descendant KVEnv can be re-sampled when it subscribes to
        // a Ref from an Ancestor's environment.
        () => sendEvent(event),
      ),
    )
}

function makeGetKV(references: Map<any, any>, sendEvent: (event: Event<any, any>) => void): Get {
  return {
    getKV(kv) {
      if (references.has(kv.key)) {
        return E.of(references.get(kv.key)!)
      }

      return pipe(
        kv.initial,
        E.chainFirstIOK((value) => () => sendEvent({ _tag: 'Created', kv, value, env: O.none })),
      )
    },
  }
}

function makeHasKV(references: Map<any, any>): Has {
  return {
    hasKV(kv) {
      return E.fromIO(() => references.has(kv.key))
    },
  }
}

function makeSetKV(references: Map<any, any>, sendEvent: (event: Event<any, any>) => void): Set {
  const { getKV } = makeGetKV(references, sendEvent)

  return {
    setKV(kv, value) {
      return pipe(
        kv,
        getKV,
        E.chainFirstIOK(
          (previousValue) => () =>
            sendEvent({ _tag: 'Updated', kv, previousValue, value, env: O.none }),
        ),
        E.constant(value),
      )
    },
  }
}

function makeDeleteKV(
  references: Map<any, any>,
  sendEvent: (event: Event<any, any>) => void,
): Remove {
  return {
    removeKV(kv) {
      return pipe(
        E.fromIO(() => (references.has(kv.key) ? O.some(references.get(kv.key)) : O.none)),
        E.chainFirstIOK(() => () => sendEvent({ _tag: 'Removed', kv, env: O.none })),
      )
    },
  }
}

/**
 * Creates a union of Envs for all the possible combinations for Ref environments.
 * @since 0.11.0
 * @category Type-level
 */
export type Env<E, A> =
  | E.Env<E, A>
  | GetEnv<CombinationsOf<E, [Get, Has, Set, Remove, Events, ParentKVEnv]>, A>

/**
 * Creates a union of ReaderStreams for all the possible combinations for Ref environments.
 * @since 0.11.0
 * @category Type-level
 */
export type ReaderStream<E, A> =
  | RS.ReaderStream<E, A>
  | GetReaderStream<CombinationsOf<E, [Get, Has, Set, Remove, Events, ParentKVEnv]>, A>

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
 * @since 0.11.0
 * @category Combinator
 */
export const sample = <E, A>(env: Env<E, A>): RS.ReaderStream<E & KVEnv, A> =>
  pipe(
    getKVEvents,
    RS.filter(not(isCreated)),
    RS.startWith(null),
    RS.exhaustMapLatestEnv(() => env),
  )

/**
 * Traverse up the tree of KVEnv and parent KVEnv to find the closest KVEnv that
 * has reference for a given KV. This is useful for providing a React-like Context
 * API atop of KV.
 * @since 0.11.0
 * @category Combinator
 */
export const findKVProvider = <E, A>(ref: KV<E, A>): E.Env<KVEnv, KVEnv> => {
  const check = pipe(
    E.Do,
    E.bindW('hasRef', () => has(ref)),
    E.bindW('env', () => getKVEnv),
  )

  return pipe(
    check,
    E.chainW(
      E.chainRec(({ hasRef, env }: E.ValueOf<typeof check>) => {
        if (hasRef || O.isNone(env.parentKVEnv)) {
          return pipe(env, EE.of)
        }

        return pipe(check, E.useSome(env.parentKVEnv.value), EE.fromEnvL)
      }),
    ),
  )
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const withProvider =
  <E, A>(kv: KV<E, A>) =>
  <E2, B>(env: Env<E2, B>) =>
    pipe(
      kv,
      findKVProvider,
      E.chainW((refs) => pipe(env, E.useSome(refs))),
    )

/**
 * @since 0.11.0
 * @category Combinator
 */
export const withProviderStream =
  <E, A>(kv: KV<E, A>) =>
  <E2, B>(rs: ReaderStream<E2, B>) =>
    pipe(
      kv,
      findKVProvider,
      RS.fromEnv,
      RS.switchMapW((refs) => pipe(rs, RS.useSome(refs))),
    )
