/**
 * `KV` is an abstraction for managing state-based applications using [Env](./Env.ts.md). It exposes an extensible
 * get/set/delete API for managing keys to values. Every `KV` is connected to an `Env` that will
 * provide the default value lazily when first asked for or after being deleted previously.
 *
 * The provided implementation will also send events containing all of the creations/updates/deletes
 * occurring in real-time.
 * @since 0.11.0
 */
import * as B from 'fp-ts/boolean'
import { Eq, EqStrict } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'
import * as RM from 'fp-ts/ReadonlyMap'
import { not } from 'fp-ts/Refinement'
import { fst, snd } from 'fp-ts/Tuple2'

import * as A from './Adapter'
import * as D from './Disposable'
import * as E from './Env'
import * as EE from './EnvEither'
import { alwaysEqualsEq, deepEqualsEq } from './Eq'
import * as O from './Option'
import * as RS from './ReaderStream'
import * as R from './Resume'

/**
 * @since 0.11.0
 * @category Model
 */
export interface KV<K, E, A> extends Eq<A> {
  readonly key: K
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
export const get = <K, E, A>(kv: KV<K, E, A>) => E.asksE((e: Get) => e.getKV(kv))

/**
 * @since 0.12.0
 * @category Environment
 */
export interface Get {
  readonly getKV: <K, E, A>(kv: KV<K, E, A>) => E.Env<E, A>
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const has = <K, E, A>(kv: KV<K, E, A>) => E.asksE((e: Has) => e.hasKV(kv))

/**
 * @since 0.12.0
 * @category Environment
 */
export interface Has {
  readonly hasKV: <K, E, A>(kv: KV<K, E, A>) => E.Of<boolean>
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const set =
  <K, E, A>(kv: KV<K, E, A>) =>
  (value: A) =>
    E.asksE((e: Set) => e.setKV(kv, value))

/**
 * @since 0.12.0
 * @category Environment
 */
export interface Set {
  readonly setKV: <K, E, A>(kv: KV<K, E, A>, value: A) => E.Env<E, A>
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
export const remove = <K, E, A>(kv: KV<K, E, A>) => E.asksE((e: Remove) => e.removeKV(kv))

/**
 * @since 0.12.0
 * @category Environment
 */
export interface Remove {
  readonly removeKV: <K, E, A>(kv: KV<K, E, A>) => E.Env<E, O.Option<A>>
}

/**
 * @since 0.12.0
 * @category Environment
 */
export interface Events {
  readonly kvEvents: Adapter
}

/**
 * @since 0.12.0
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
export const sendEvent = <K, A>(event: Event<K, A>) => pipe(getSendEvent, E.apW(E.of(event)))

/**
 * @since 0.12.0
 * @category Combinator
 */
export const getKVEvents: RS.ReaderStream<Events, Event<any, any>> = (e: Events) => snd(e.kvEvents)

/**
 * @since 0.11.0
 * @category Combinator
 */
export const listenTo = <K, E, A>(kv: KV<K, E, A>): RS.ReaderStream<Events, Event<K, A>> =>
  pipe(
    getKVEvents,
    RS.filter((x) => x.key === kv.key),
  )

/**
 * @since 0.11.0
 * @category Combinator
 */
export const listenToValues = <K, E, A>(
  kv: KV<K, E, A>,
): RS.ReaderStream<E & Events, O.Option<A>> =>
  pipe(
    kv,
    listenTo,
    RS.map((e) => (isRemoved(e) ? O.none : O.some(e.value))),
    RS.startWith(O.none),
  )

/**
 * @since 0.12.0
 * @category Environment
 */
export interface ParentKVEnv {
  readonly parentKVEnv: O.Option<Env>
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const getParentKVs = E.asks((e: ParentKVEnv) => e.parentKVEnv)

/**
 * Traverse up the tree of KVEnv and parent KVEnv to find the closest KVEnv that
 * has reference for a given KV. This is useful for providing a React-like Context
 * API atop of KV.
 * @since 0.11.0
 * @category Combinator
 */
export const findKVProvider = <K, E, A>(ref: KV<K, E, A>): E.Env<Env, Env> => {
  const check = pipe(
    E.Do,
    E.bindW('hasRef', () => has(ref)),
    E.bindW('env', () => getEnv),
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
 * @since 0.12.0
 * @category Environment
 */
export interface Env extends Get, Has, Set, Remove, Events, ParentKVEnv {}

/**
 * @since 0.12.0
 * @category Combinator
 */
export const getEnv = E.asks(
  ({ getKV, hasKV, setKV, removeKV, kvEvents, parentKVEnv }: Env): Env => ({
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
export type Adapter = A.Adapter<Event<any, any>>

/**
 * @since 0.12.0
 * @category Model
 */
export type Event<K, A> = Created<K, A> | Updated<K, A> | Removed<K>

/**
 * @since 0.12.0
 * @category Model
 */
export interface Created<K, A> {
  readonly _tag: 'Created'
  readonly key: K
  readonly value: A
  readonly fromAncestor: boolean
}

/**
 * @since 0.11.0
 * @category Refinement
 */
export const isCreated = <K, A>(event: Event<K, A>): event is Created<K, A> =>
  event._tag === 'Created'

/**
 * @since 0.12.0
 * @category Model
 */
export interface Updated<K, A> {
  readonly _tag: 'Updated'
  readonly key: K
  readonly previousValue: A
  readonly value: A
  readonly fromAncestor: boolean
}

/**
 * @since 0.11.0
 * @category Refinement
 */
export const isUpdated = <K, A>(event: Event<K, A>): event is Updated<K, A> =>
  event._tag === 'Updated'

/**
 * @since 0.12.0
 * @category Model
 */
export interface Removed<K> {
  readonly _tag: 'Removed'
  readonly key: K
  readonly fromAncestor: boolean
}

/**
 * @since 0.11.0
 * @category Refinement
 */
export const isRemoved = <K, A>(event: Event<K, A>): event is Removed<K> => event._tag === 'Removed'

/**
 * @since 0.12.0
 * @category Deconstructor
 */
export const matchW =
  <A, K, B, C, D>(
    onCreated: (value: A, key: K) => B,
    onUpdated: (previousValue: A, value: A, key: K) => C,
    onDeleted: (key: K) => D,
  ) =>
  (event: Event<K, A>): B | C | D => {
    if (event._tag === 'Updated') {
      return onUpdated(event.previousValue, event.value, event.key)
    }

    if (event._tag === 'Created') {
      return onCreated(event.value, event.key)
    }

    return onDeleted(event.key)
  }

/**
 * @since 0.12.0
 * @category Deconstructor
 */
export const match: <A, K, B>(
  onCreated: (value: A, key: K) => B,
  onUpdated: (previousValue: A, value: A, key: K) => B,
  onDeleted: (key: K) => B,
) => (event: Event<K, A>) => B = matchW

/**
 * @since 0.12.0
 * @category Environment Constructor
 */
export function env(options: EnvOptions = {}): Env {
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
export type EnvOptions = {
  readonly initial?: Iterable<readonly [any, any]>
  readonly kvEvents?: Adapter
  readonly parentKVEnv?: Env
}

function createSendEvent<K>(references: Map<any, any>, [push]: Adapter) {
  return (event: Event<K, any>) =>
    pipe(
      event.fromAncestor,
      B.matchW(
        // Only update our local references when event.fromAncestor is false
        // as this indicates the event originates from within our current environment.
        () => {
          if (event._tag === 'Created' || event._tag === 'Updated') {
            references.set(event.key, event.value)
          } else {
            references.delete(event.key)
          }

          push(event)
        },
        // When event.fromAncestor is true, the event originated from another environment.
        // We only replicate the event such that a descendant KVEnv can be re-sampled when it subscribes to
        // a Ref from an Ancestor's environment.
        () => push(event),
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
        E.chainFirstIOK(
          (value) => () => sendEvent({ _tag: 'Created', key: kv.key, value, fromAncestor: false }),
        ),
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
        E.map((previousValue) => [previousValue, !pipe(value, kv.equals(previousValue))] as const),
        E.chainFirstIOK(
          ([previousValue, changed]) =>
            () =>
              // Only send event when things changed
              changed &&
              sendEvent({
                _tag: 'Updated',
                key: kv.key,
                previousValue,
                value,
                fromAncestor: false,
              }),
        ),
        E.map(([previousValue, changed]) => (changed ? value : previousValue)),
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
        E.chainFirstIOK(
          () => () => sendEvent({ _tag: 'Removed', key: kv.key, fromAncestor: false }),
        ),
      )
    },
  }
}

/**
 * Sample an Env with the latest references when updates have occured.
 * @since 0.11.0
 * @category Combinator
 */
export const sample = <E, A>(env: E.Env<E, A>): RS.ReaderStream<E & Env, A> =>
  pipe(
    getKVEvents,
    RS.filter(not(isCreated)),
    RS.startWith(null),
    RS.exhaustMapLatestEnv(() => env),
  )

/**
 * A shared KV for keeping track of a context's disposable resources.
 * @since 0.11.0
 * @category KV
 */
export const Disposable = make(E.fromIO(D.settable), {
  ...EqStrict,
  key: Symbol.for('@typed/fp/KV.Disposable'),
})

/**
 * @since 0.11.0
 * @category Use
 */
export const useKeyedEnvs = <A>(Eq: Eq<A>) => {
  const refs = make(
    E.fromIO(() => new Map<A, Env>()),
    alwaysEqualsEq,
  )
  const lookup = RM.lookup(Eq)

  const getOrCreate = <E>(key: A, value: E.Env<E, Env>) =>
    pipe(
      refs,
      get,
      E.chainW((m) =>
        pipe(
          m,
          lookup(key),
          O.matchW(
            () =>
              pipe(
                value,
                E.tap((x: Env) => m.set(key, x)),
              ),
            E.of,
          ),
        ),
      ),
    )

  const dispose = pipe(
    Disposable,
    get,
    E.tap((d) => d.dispose()),
    E.chainFirstW(() => remove(Disposable)),
  )

  return pipe(
    E.Do,
    E.apSW('parentKVEnv', getEnv),
    E.bindW('createRefs', ({ parentKVEnv }) =>
      E.of((key: A) => {
        const r = env({ parentKVEnv })

        return pipe(
          refs,
          get,
          E.map((m) => m.set(key, r)),
          E.constant(r),
          E.useSome(parentKVEnv),
        )
      }),
    ),
    E.bindW('findRefs', ({ createRefs, parentKVEnv }) =>
      E.of((key: A) => pipe(getOrCreate(key, createRefs(key)), E.useSome(parentKVEnv))),
    ),
    E.bindW('deleteRefs', ({ parentKVEnv }) =>
      E.of(
        (key: A): D.Disposable => ({
          dispose: () =>
            pipe(
              parentKVEnv,
              get(refs),
              R.map((refs) => refs.get(key)),
              R.chainFirst(() =>
                pipe(
                  refs,
                  get,
                  E.tap((m) => m.delete(key)),
                )(parentKVEnv),
              ),
              R.chain((refs) => (refs ? dispose(refs) : R.of(null))),
              R.exec,
            ),
        }),
      ),
    ),
    E.map(({ findRefs, deleteRefs }) => ({ findRefs, deleteRefs } as const)),
  )
}
