/**
 * `Ref` is an abstraction for managing data-driven applications using [Env](./Env.ts.md).
 * @since 0.11.0
 */
import * as Ap from 'fp-ts/Apply'
import * as B from 'fp-ts/boolean'
import { EqStrict } from 'fp-ts/Eq'
import { flow, pipe } from 'fp-ts/function'
import { Functor3 } from 'fp-ts/Functor'
import { IO } from 'fp-ts/IO'
import { concatAll } from 'fp-ts/Monoid'
import { Profunctor3 } from 'fp-ts/Profunctor'
import { Reader } from 'fp-ts/Reader'
import * as RA from 'fp-ts/ReadonlyArray'
import { Semigroupoid3 } from 'fp-ts/Semigroupoid'
import { Task } from 'fp-ts/Task'
import { U } from 'ts-toolbelt'

import * as E from './Env'
import * as EO from './EnvOption'
import * as FKV from './FromKV'
import { Intersect } from './HKT'
import * as KV from './KV'
import * as O from './Option'
import * as P from './Provide'
import * as RS from './ReaderStream'
import * as RSO from './ReaderStreamOption'
import { Resume } from './Resume'
import * as S from './struct'

const allBooleans = E.map(concatAll(B.MonoidAll))

/**
 * @since 0.11.0
 * @category Model
 */
export interface Ref<E, I, O = I> {
  readonly get: E.Env<E, O>
  readonly has: E.Env<E, boolean>
  readonly set: (input: I) => E.Env<E, O>
  readonly update: <E2>(f: (value: O) => E.Env<E2, I>) => E.Env<E & E2, O>
  readonly remove: E.Env<E, O.Option<O>>
  readonly values: RS.ReaderStream<E, O.Option<O>>
}

/**
 * @since 0.11.0
 * @category Type-level
 */
export type RequirementsOf<A> = [A] extends [Ref<infer R, any, any>] ? R : never

/**
 * @since 0.11.0
 * @category Type-level
 */
export type InputOf<A> = [A] extends [Ref<any, infer R, any>] ? R : never

/**
 * @since 0.11.0
 * @category Type-level
 */
export type OutputOf<A> = [A] extends [Ref<any, any, infer R>] ? R : never

/**
 * @since 0.11.0
 * @category URI
 */
export const URI = '@typed/fp/Ref'

/**
 * @since 0.11.0
 * @category URI
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: Ref<E, A>
  }

  export interface URItoKind3<R, E, A> {
    [URI]: Ref<R, E, A>
  }
}

declare module './HKT' {
  export interface URItoVariance {
    [URI]: V<R, Contravariant>
  }
}

/**
 * @since 0.11.0
 * @category Constructor
 */
export const fromKV = <K, E, A>(kv: KV.KV<K, E, A>): Ref<E & KV.Env, A> & KV.KV<K, E, A> => ({
  ...kv,
  get: KV.get(kv),
  has: KV.has(kv),
  set: KV.set(kv),
  update: KV.update(kv),
  remove: KV.remove(kv),
  values: KV.listenToValues(kv),
})

/**
 * @since 0.11.0
 * @category Constructor
 */
export const kv = flow(KV.make, fromKV)

/**
 * @since 0.12.0
 * @category Instance Constructor
 */
export const FromKV: FKV.FromKV2<URI, KV.Env> = {
  fromKV,
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const map =
  <A, B>(f: (value: A) => B) =>
  <E, I>(ref: Ref<E, I, A>): Ref<E, I, B> => ({
    get: pipe(ref.get, E.map(f)),
    has: ref.has,
    set: flow(ref.set, E.map(f)),
    update: (g) => pipe(ref.get, E.map(f), E.chainW(g), E.chainW(ref.set), E.map(f)),
    remove: pipe(ref.remove, EO.map(f)),
    values: pipe(ref.values, RSO.map(f)),
  })

/**
 * @since 0.11.0
 * @category Instance
 */
export const Functor: Functor3<URI> = {
  map,
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const local =
  <A, B>(f: (value: A) => B) =>
  <E, C>(ref: Ref<E, B, C>): Ref<E, A, C> => ({
    get: ref.get,
    has: ref.has,
    set: flow(f, ref.set),
    update: (g) => ref.update(flow(g, E.map(f))),
    remove: ref.remove,
    values: ref.values,
  })

/**
 * @since 0.11.0
 * @category Combinator
 */
export const promap =
  <B, A, C, D>(f: (value: B) => A, g: (value: C) => D) =>
  <E>(ref: Ref<E, A, C>): Ref<E, B, D> =>
    pipe(ref, local(f), map(g))

/**
 * @since 0.11.0
 * @category Instance
 */
export const Profunctor: Profunctor3<URI> = {
  map,
  promap,
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const ap =
  <E1, I, A>(fa: Ref<E1, I, A>) =>
  <E2, B>(fab: Ref<E2, I, (value: A) => B>): Ref<E1 & E2, I, B> => {
    const get = pipe(fab.get, E.apW(fa.get))
    const set = (i: I) => pipe(i, fab.set, E.apW(fa.set(i)))

    return {
      get,
      has: pipe([], E.of, E.apTW(fa.has), E.apTW(fab.has), allBooleans),
      set: (i) => pipe(i, fab.set, E.apW(fa.set(i))),
      update: (f) => pipe(get, E.chainW(f), E.chainW(set)),
      remove: pipe(fab.remove, EO.apW(fa.remove)),
      values: pipe(fab.values, RSO.apW(fa.values)),
    }
  }

/**
 * @since 0.11.0
 * @category Instance
 */
export const Apply: Ap.Apply3<URI> = {
  map,
  ap,
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const apFirst = Ap.apFirst(Apply)

/**
 * @since 0.11.0
 * @category Combinator
 */
export const apFirstW = apFirst as <R1, E, B>(
  second: Ref<R1, E, B>,
) => <R2, A>(first: Ref<R2, E, A>) => Ref<R1 & R2, E, A>

/**
 * @since 0.11.0
 * @category Combinator
 */
export const apS = Ap.apS(Apply)

/**
 * @since 0.11.0
 * @category Combinator
 */
export const apSW = apS as <N extends string, A, R1, E, B>(
  name: Exclude<N, keyof A>,
  fb: Ref<R1, E, B>,
) => <R2>(
  fa: Ref<R2, E, A>,
) => Ref<R1 & R2, E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>

/**
 * @since 0.11.0
 * @category Combinator
 */
export const apSecond = Ap.apSecond(Apply)

/**
 * @since 0.11.0
 * @category Combinator
 */
export const apSecondW = apSecond as <R1, E, B>(
  second: Ref<R1, E, B>,
) => <R2, A>(first: Ref<R2, E, A>) => Ref<R1 & R2, E, B>

/**
 * @since 0.11.0
 * @category Combinator
 */
export const apT = Ap.apT(Apply)

/**
 * @since 0.11.0
 * @category Combinator
 */
export const apTW = apT as <R1, E, B>(
  fb: Ref<R1, E, B>,
) => <R2, A extends readonly unknown[]>(fas: Ref<R2, E, A>) => Ref<R1 & R2, E, readonly [...A, B]>

/**
 * @since 0.11.0
 * @category Typeclass Constructor
 */
export const getApplySemigroup = Ap.getApplySemigroup(Apply)

/**
 * @since 0.11.0
 * @category Combinator
 */
export const compose =
  <E2, A, O>(second: Ref<E2, A, O>) =>
  <E1, I>(first: Ref<E1, I, A>): Ref<E1 & E2, I, O> => ({
    get: pipe(second.get, E.apFirstW(first.get)), // Ensure both exist
    has: pipe(first.has, E.tupled, E.apTW(second.has), allBooleans),
    set: flow(first.set, E.chainW(second.set)),
    update: (f) => pipe(second.get, E.chainW(f), E.chainW(first.set), E.chainW(second.set)),
    remove: pipe(second.remove, E.apFirstW(first.remove)), // Remove both in parallel
    values: pipe(
      second.values,
      RS.mergeFirst(
        // Replicate all values into the second
        pipe(
          first.values,
          RS.chainFirstEnvK(O.matchW(() => second.remove, flow(second.set, EO.fromEnv))),
        ),
      ),
      RS.skipRepeatsWith(O.getEq(EqStrict)), // Avoid sending duplicates
    ),
  })

/**
 * @since 0.11.0
 * @category Instance
 */
export const Semigroupoid: Semigroupoid3<URI> = {
  compose,
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const provideSome =
  <E1>(provided: E1) =>
  <E2, A, B>(ref: Ref<E1 & E2, A, B>): Ref<E2, A, B> => {
    return {
      get: pipe(ref.get, E.provideSome(provided)),
      has: pipe(ref.has, E.provideSome(provided)),
      set: flow(ref.set, E.provideSome(provided)),
      update: flow(ref.update, E.provideSome(provided)),
      remove: pipe(ref.remove, E.provideSome(provided)),
      values: pipe(ref.values, RS.provideSome(provided)),
    }
  }

/**
 * @since 0.11.0
 * @category Combinator
 */
export const provideAll: <E>(provided: E) => <A, B>(ref: Ref<E, A, B>) => Ref<unknown, A, B> =
  provideSome

/**
 * @since 0.11.0
 * @category Combinator
 */
export const useSome =
  <E1>(provided: E1) =>
  <E2, A, B>(ref: Ref<E1 & E2, A, B>): Ref<E2, A, B> => {
    return {
      get: pipe(ref.get, E.useSome(provided)),
      has: pipe(ref.has, E.useSome(provided)),
      set: flow(ref.set, E.useSome(provided)),
      update: flow(ref.update, E.useSome(provided)),
      remove: pipe(ref.remove, E.useSome(provided)),
      values: pipe(ref.values, RS.useSome(provided)),
    }
  }

/**
 * @since 0.11.0
 * @category Combinator
 */
export const useAll: <E1>(provided: E1) => <A, B>(ref: Ref<E1, A, B>) => Ref<unknown, A, B> =
  useSome

/**
 * @since 0.11.0
 * @category Instance
 */
export const UseSome: P.UseSome3<URI> = {
  useSome,
}

/**
 * @since 0.11.0
 * @category Instance
 */
export const UseAll: P.UseAll3<URI> = {
  useAll,
}

/**
 * @since 0.11.0
 * @category Instance
 */
export const ProvideSome: P.ProvideSome3<URI> = {
  provideSome,
}

/**
 * @since 0.11.0
 * @category Instance
 */
export const ProvideAll: P.ProvideAll3<URI> = {
  provideAll,
}

/**
 * @since 0.11.0
 * @category Instance
 */
export const Provide: P.Provide3<URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export function chainEnvK<A, E1, B>(f: (value: A) => E.Env<E1, B>) {
  return <E2, I>(ref: Ref<E2, I, A>): Ref<E1 & E2, I, B> => ({
    get: pipe(ref.get, E.chainW(f)),
    has: ref.has,
    set: flow(ref.set, E.chainW(f)),
    update: (g) => pipe(flow(f, E.chainW(g)), ref.update, E.chainW(f)),
    remove: pipe(ref.remove, EO.chainEnvK(f)),
    values: pipe(ref.values, RSO.chainEnvK(f)),
  })
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export function chainFirstEnvK<A, E1, B>(f: (value: A) => E.Env<E1, B>) {
  return <E2, I>(ref: Ref<E2, I, A>): Ref<E1 & E2, I, A> => ({
    get: pipe(ref.get, E.chainFirstW(f)),
    has: ref.has,
    set: flow(ref.set, E.chainFirstW(f)),
    update: flow(ref.update, E.chainFirstW(f)),
    remove: pipe(ref.remove, EO.chainFirstEnvK(f)),
    values: pipe(ref.values, RSO.chainFirstEnvK(f)),
  })
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export function chainIOK<A, B>(f: (value: A) => IO<B>) {
  return pipe(f, E.fromIOK, chainEnvK)
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export function chainFirstIOK<A, B>(f: (value: A) => IO<B>) {
  return pipe(f, E.fromIOK, chainFirstEnvK)
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export function chainReaderK<A, E1, B>(f: (value: A) => Reader<E1, B>) {
  return pipe(f, E.fromReaderK, chainEnvK)
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export function chainFirstReaderK<A, E1, B>(f: (value: A) => Reader<E1, B>) {
  return pipe(f, E.fromReaderK, chainFirstEnvK)
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export function chainResumeK<A, B>(f: (value: A) => Resume<B>) {
  return pipe(f, E.fromResumeK, chainEnvK)
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export function chainFirstResumeK<A, B>(f: (value: A) => Resume<B>) {
  return pipe(f, E.fromResumeK, chainFirstEnvK)
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export function chainTaskK<A, B>(f: (value: A) => Task<B>) {
  return pipe(f, E.fromTaskK, chainEnvK)
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export function chainFirstTaskK<A, B>(f: (value: A) => Task<B>) {
  return pipe(f, E.fromTaskK, chainFirstEnvK)
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export function struct<S extends AnyRefStruct>(
  properties: S,
): Ref<RefStructEnv<S>, RefStructInput<S>, RefStructOutput<S>> {
  const entries = Object.entries(properties)

  const zipAssign = flow(
    E.zipW,
    E.map((props) => Object.assign({}, ...props) as RefStructOutput<S>),
  )

  const get = pipe(
    entries,
    RA.map(([k, ref]) =>
      pipe(
        ref.get,
        E.map((v) => S.make(k, v)),
      ),
    ),
    zipAssign,
  )

  const has = pipe(
    Object.values(properties),
    RA.map((ref) => ref.has),
    E.zipW,
    allBooleans,
  )

  const set = (i: RefStructInput<S>) =>
    pipe(
      i,
      Object.entries,
      RA.map(([k, v]) =>
        pipe(
          v,
          properties[k].set,
          E.map((v) => S.make(k, v)),
        ),
      ),
      zipAssign,
    )

  const remove = pipe(
    entries,
    RA.map(([k, ref]) =>
      pipe(
        ref.remove,
        EO.map((v) => S.make(k, v)),
      ),
    ),
    E.zipW,
    E.map(
      flow(
        O.traverseReadonlyArrayWithIndex((_, a) => a),
        O.map((xs) => Object.assign({}, ...xs) as RefStructOutput<S>),
      ),
    ),
  )

  const values = pipe(
    RS.combineAll(
      ...pipe(
        entries,
        RA.map(([k, ref]) =>
          pipe(
            ref.values,
            RSO.map((v) => S.make(k, v)),
          ),
        ),
      ),
    ),
    RS.map(
      flow(
        O.traverseReadonlyArrayWithIndex((_, a) => a),
        O.map((xs) => Object.assign({}, ...xs) as RefStructOutput<S>),
      ),
    ),
  )

  return {
    get,
    has,
    set,
    update: (f) => pipe(get, E.chainW(f), E.chainW(set)),
    remove,
    values,
  }
}

type AnyRefStruct = Readonly<Record<string, Ref<any, any, any>>>

type RefStructEnv<S extends AnyRefStruct> = Intersect<
  U.ListOf<
    {
      [K in keyof S]: E.RequirementsOf<S[K]>
    }[keyof S]
  >
>

type RefStructInput<S extends AnyRefStruct> = {
  readonly [K in keyof S]: InputOf<S[K]>
}

type RefStructOutput<S extends AnyRefStruct> = {
  readonly [K in keyof S]: OutputOf<S[K]>
}
