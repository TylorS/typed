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
import { flow, pipe } from 'fp-ts/function'
import { not } from 'fp-ts/Refinement'
import { fst, snd } from 'fp-ts/Tuple2'

import * as A from './Adapter'
import * as E from './Env'
import * as EE from './EnvEither'
import { deepEqualsEq } from './Eq'
import * as O from './Option'
import * as RS from './ReaderStream'

/**
 * @since 0.11.0
 * @category Model
 */
export interface KV<K, E, A> extends Eq<A> {
  readonly key: K // Use function to ensure this is a covariant property
  readonly initial: E.Env<E, A>
}

/**
 * @since 0.11.0
 * @category Model
 */
export interface Of<K, A> extends KV<K, unknown, A> {}

/**
 * @since 0.11.0
 * @category Type-level
 */
export type KeyOf<A> = [A] extends [KV<infer R, any, any>] ? R : never

/**
 * @since 0.11.0
 * @category Type-level
 */
export type EnvOf<A> = [A] extends [KV<any, infer R, any>] ? R : never

/**
 * @since 0.11.0
 * @category Type-level
 */
export type ValueOf<A> = [A] extends [KV<any, any, infer R>] ? R : never

/**
 * @since 0.11.0
 * @category Options
 */
export type Options<K, A> = {
  readonly key?: K
} & Partial<Eq<A>>

/**
 * Note that by default an incrementing index is utilized to generate a key if one is not
 * provided. In other words, by default, this is not referentially transparent for
 * your own convenience
 *
 * @since 0.11.0
 * @category Constructor
 */
export function make<E, A, K = symbol>(
  initial: E.Env<E, A>,
  options: Options<K, A> = {},
): KV<K, E, A> {
  const { equals = deepEqualsEq.equals, key = Symbol() as unknown as K } = options

  return {
    key,
    initial,
    equals,
  }
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const get = <K, E, A>(kv: KV<K, E, A>) => E.asksE((e: Get<K>) => e.getKV(kv))

/**
 * @since 0.11.0
 * @category Environment
 */
export interface Get<K> {
  readonly getKV: <E, A>(kv: KV<K, E, A>) => E.Env<E, A>
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const has = <K, E, A>(kv: KV<K, E, A>) => E.asksE((e: Has<K>) => e.hasKV(kv))

/**
 * @since 0.11.0
 * @category Environment
 */
export interface Has<K> {
  readonly hasKV: <E, A>(kv: KV<K, E, A>) => E.Of<boolean>
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const set =
  <K, E, A>(kv: KV<K, E, A>) =>
  (value: A) =>
    E.asksE((e: Set<K>) => e.setKV(kv, value))

/**
 * @since 0.11.0
 * @category Environment
 */
export interface Set<K> {
  readonly setKV: <E, A>(kv: KV<K, E, A>, value: A) => E.Env<E, A>
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const update =
  <K, E1, A>(kv: KV<K, E1, A>) =>
  <E2>(f: (value: A) => E.Env<E2, A>) =>
    pipe(kv, get, E.chainW(f), E.chainW(set(kv)))

/**
 * @since 0.11.0
 * @category Combinator
 */
export const remove = <K, E, A>(kv: KV<K, E, A>) => E.asksE((e: Remove<K>) => e.removeKV(kv))

/**
 * @since 0.11.0
 * @category Environment
 */
export interface Remove<K> {
  readonly removeKV: <E, A>(kv: KV<K, E, A>) => E.Env<E, O.Option<A>>
}

/**
 * @since 0.11.0
 * @category Environment
 */
export interface Events<K> {
  readonly kvEvents: Adapter<K>
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const getAdapter = <K = any>() => E.asks((e: Events<K>) => e.kvEvents)

/**
 * @since 0.11.0
 * @category Combinator
 */
export const getSendEvent = flow(getAdapter, E.map(fst))

/**
 * @since 0.11.0
 * @category Combinator
 */
export const sendEvent = <K, E, A>(event: Event<K, E, A>) =>
  pipe(getSendEvent<K>(), E.apW(E.of(event)))

/**
 * @since 0.11.0
 * @category Combinator
 */
export const getKVEvents =
  <K>(): RS.ReaderStream<Events<K>, Event<K, any, any>> =>
  (e: Events<K>) =>
    snd(e.kvEvents)

/**
 * @since 0.11.0
 * @category Combinator
 */
export const listenTo = <K, E, A>(kv: KV<K, E, A>): RS.ReaderStream<Events<K>, Event<K, E, A>> =>
  pipe(
    getKVEvents<K>(),
    RS.filter((x) => x.kv.key === kv.key),
  )

/**
 * @since 0.11.0
 * @category Combinator
 */
export const listenToValues = <K, E, A>(
  kv: KV<K, E, A>,
): RS.ReaderStream<E & Events<K>, O.Option<A>> =>
  pipe(
    kv,
    listenTo,
    RS.map((e) => (isRemoved(e) ? O.none : O.some(e.value))),
    RS.startWith(O.none),
  )

/**
 * @since 0.11.0
 * @category Environment
 */
export interface ParentKVEnv<K> {
  readonly parentKVEnv: O.Option<KVEnv<K>>
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const getParentKVs = <K>() => E.asks((e: ParentKVEnv<K>) => e.parentKVEnv)

/**
 * Traverse up the tree of KVEnv and parent KVEnv to find the closest KVEnv that
 * has reference for a given KV. This is useful for providing a React-like Context
 * API atop of KV.
 * @since 0.11.0
 * @category Combinator
 */
export const findKVProvider = <K, E, A>(ref: KV<K, E, A>): E.Env<KVEnv<K>, KVEnv<K>> => {
  const check = pipe(
    E.Do,
    E.bindW('hasRef', () => has(ref)),
    E.bindW('env', () => getKVEnv<K>()),
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
  <K, E, A>(kv: KV<K, E, A>) =>
  <E2, B>(env: E.Env<E2, B>) =>
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
  <K, E, A>(kv: KV<K, E, A>) =>
  <E2, B>(rs: RS.ReaderStream<E2, B>) =>
    pipe(
      kv,
      findKVProvider,
      RS.fromEnv,
      RS.switchMapW((refs) => pipe(rs, RS.useSome(refs))),
    )

/**
 * @since 0.11.0
 * @category Environment
 */
export interface KVEnv<K> extends Get<K>, Has<K>, Set<K>, Remove<K>, Events<K>, ParentKVEnv<K> {}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const getKVEnv = <K>() =>
  E.asks(
    ({ getKV, hasKV, setKV, removeKV, kvEvents, parentKVEnv }: KVEnv<K>): KVEnv<K> => ({
      getKV,
      hasKV,
      setKV,
      removeKV,
      kvEvents,
      parentKVEnv,
    }),
  )

/**
 * @since 0.11.0
 * @category Model
 */
export type Adapter<K> = A.Adapter<Event<K, any, any>>

/**
 * @since 0.11.0
 * @category Model
 */
export type Event<K, E, A> = Created<K, E, A> | Updated<K, E, A> | Removed<K, E, A>

/**
 * @since 0.11.0
 * @category Model
 */
export interface Created<K, E, A> {
  readonly _tag: 'Created'
  readonly kv: KV<K, E, A>
  readonly value: A
  readonly env: O.Option<KVEnv<K>>
}

/**
 * @since 0.11.0
 * @category Refinement
 */
export const isCreated = <K, E, A>(event: Event<K, E, A>): event is Created<K, E, A> =>
  event._tag === 'Created'

/**
 * @since 0.11.0
 * @category Model
 */
export interface Updated<K, E, A> {
  readonly _tag: 'Updated'
  readonly kv: KV<K, E, A>
  readonly previousValue: A
  readonly value: A
  readonly env: O.Option<KVEnv<K>>
}

/**
 * @since 0.11.0
 * @category Refinement
 */
export const isUpdated = <K, E, A>(event: Event<K, E, A>): event is Updated<K, E, A> =>
  event._tag === 'Updated'

/**
 * @since 0.11.0
 * @category Model
 */
export interface Removed<K, E, A> {
  readonly _tag: 'Removed'
  readonly kv: KV<K, E, A>
  readonly env: O.Option<KVEnv<K>>
}

/**
 * @since 0.11.0
 * @category Refinement
 */
export const isRemoved = <K, E, A>(event: Event<K, E, A>): event is Removed<K, E, A> =>
  event._tag === 'Removed'

/**
 * @since 0.11.0
 * @category Deconstructor
 */
export const matchW =
  <A, K, B, C, D, E>(
    onCreated: (value: A, kv: KV<K, B, A>) => C,
    onUpdated: (previousValue: A, value: A, kv: KV<K, B, A>) => D,
    onDeleted: (kv: KV<K, B, A>) => E,
  ) =>
  (event: Event<K, B, A>): C | D | E => {
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
export const match: <A, K, B, C>(
  onCreated: (value: A, kv: KV<K, B, A>) => C,
  onUpdated: (previousValue: A, value: A, kv: KV<K, B, A>) => C,
  onDeleted: (kv: KV<K, B, A>) => C,
) => (event: Event<K, B, A>) => C = matchW

/**
 * @since 0.11.0
 * @category Environment Constructor
 */
export function env<K = any>(options: EnvOptions<K> = {}): KVEnv<K> {
  const { initial = [], kvEvents = A.create() } = options
  const references = new Map(initial)
  const sendEvent = createSendEvent(references, kvEvents)

  return {
    ...makeGetKV(references, sendEvent),
    ...makeHasKV(references),
    ...makeSetKV(references, sendEvent),
    ...makeDeleteKV(references, sendEvent),
    parentKVEnv: O.fromNullable(options.parentKVEnv),
    kvEvents: [sendEvent, kvEvents[1]],
  }
}

/**
 * @since 0.11.0
 * @category Options
 */
export type EnvOptions<K> = {
  readonly initial?: Iterable<readonly [K, any]>
  readonly kvEvents?: Adapter<K>
  readonly parentKVEnv?: KVEnv<K>
}

function createSendEvent<K>(references: Map<any, any>, [push]: Adapter<K>) {
  const updateReferences = (event: Event<K, any, any>) => {
    if (event._tag === 'Created' || event._tag === 'Updated') {
      references.set(event.kv.key, event.value)

      return
    }

    references.delete(event.kv.key)
  }

  const sendEvent = (event: Event<K, any, any>) => {
    if (event._tag === 'Created' || event._tag === 'Removed') {
      return push(event)
    }

    // Only send update events when they have changed
    if (!event.kv.equals(event.previousValue)(event.value)) {
      return push(event)
    }
  }

  return (event: Event<K, any, any>) =>
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

function makeGetKV(
  references: Map<any, any>,
  sendEvent: (event: Event<any, any, any>) => void,
): Get<any> {
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

function makeHasKV(references: Map<any, any>): Has<any> {
  return {
    hasKV(kv) {
      return E.fromIO(() => references.has(kv.key))
    },
  }
}

function makeSetKV(
  references: Map<any, any>,
  sendEvent: (event: Event<any, any, any>) => void,
): Set<any> {
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
  sendEvent: (event: Event<any, any, any>) => void,
): Remove<any> {
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
 * Sample an Env with the latest references when updates have occured.
 * @since 0.11.0
 * @category Combinator
 */
export const sample = <E, A>(env: E.Env<E, A>): RS.ReaderStream<E & KVEnv<any>, A> =>
  pipe(
    getKVEvents(),
    RS.filter(not(isCreated)),
    RS.startWith(null),
    RS.exhaustMapLatestEnv(() => env),
  )
