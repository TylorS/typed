import * as Context from '@fp-ts/data/Context'
import { flow, pipe } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'

import * as Effect from '../Effect/index.js'
import * as F from '../FiberRef/FiberRef.js'
import type { Layer } from '../Layer/Layer.js'

export interface Ref<R, E, I, O = I> {
  readonly get: Effect.Effect<R, E, O>
  readonly set: (i: I) => Effect.Effect<R, E, O>
  readonly delete: Effect.Effect<R, E, Option.Option<O>>
}

/* eslint-disable @typescript-eslint/no-unused-vars */
export type ResourcesOf<T> = T extends Ref<infer R, infer _E, infer _I, infer _O> ? R : never
export type ErrorsOf<T> = T extends Ref<infer _R, infer E, infer _I, infer _O> ? E : never
export type InputOf<T> = T extends Ref<infer _R, infer _E, infer I, infer _O> ? I : never
export type OutputOf<T> = T extends Ref<infer _R, infer _E, infer _I, infer O> ? O : never
/* eslint-enable @typescript-eslint/no-unused-vars */

export interface FromFiberRef<R, E, A> extends Ref<R, E, A>, F.FiberRef<R, E, A> {}

export function fromFiberRef<R, E, A>(fiberRef: F.FiberRef<R, E, A>): FromFiberRef<R, E, A> {
  return {
    ...fiberRef,
    get: Effect.getFiberRef(fiberRef),
    set: (a) => Effect.setFiberRef(a)(fiberRef),
    delete: Effect.deleteFiberRef(fiberRef),
  }
}

export const Ref = flow(F.FiberRef, fromFiberRef)

export function map<A, B>(f: (a: A) => B) {
  return <R, E, I>(ref: Ref<R, E, I, A>): Ref<R, E, I, B> => ({
    get: pipe(ref.get, Effect.map(f)),
    set: flow(ref.set, Effect.map(f)),
    delete: pipe(ref.delete, Effect.map(Option.map(f))),
  })
}

export function mapEffect<A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>) {
  return <R, E, I>(ref: Ref<R, E, I, A>): Ref<R | R2, E | E2, I, B> => ({
    get: pipe(ref.get, Effect.flatMap(f)),
    set: flow(ref.set, Effect.flatMap(f)),
    delete: pipe(
      ref.delete,
      Effect.flatMap(Option.match(() => Effect.of(Option.none), flow(f, Effect.map(Option.some)))),
    ),
  })
}

export function contramap<A, B>(f: (b: B) => A) {
  return <R, E, O>(ref: Ref<R, E, A, O>): Ref<R, E, B, O> => ({
    get: ref.get,
    set: flow(f, ref.set),
    delete: ref.delete,
  })
}

export function contramapEffect<A, R2, E2, B>(f: (b: B) => Effect.Effect<R2, E2, A>) {
  return <R, E, O>(ref: Ref<R, E, A, O>): Ref<R | R2, E | E2, B, O> => ({
    get: ref.get,
    set: flow(f, Effect.flatMap(ref.set)),
    delete: ref.delete,
  })
}

export function zip<R2, E2, I2, O2>(ref2: Ref<R2, E2, I2, O2>) {
  return <R, E, I1, O1>(
    ref1: Ref<R, E, I1, O1>,
  ): Ref<R | R2, E | E2, readonly [I1, I2], readonly [O1, O2]> => {
    return {
      get: Effect.zip(ref2.get)(ref1.get),
      set: ([a, b]) => Effect.zip(ref2.set(b))(ref1.set(a)),
      delete: pipe(
        ref1.delete,
        Effect.zip(ref2.delete),
        Effect.map(([a, b]) => Option.tuple(a, b)),
      ),
    }
  }
}

export function tuple<REFS extends ReadonlyArray<Ref<any, any, any>>>(
  ...refs: REFS
): Ref<
  ResourcesOf<REFS[number]>,
  ErrorsOf<REFS[number]>,
  { readonly [K in keyof REFS]: InputOf<REFS[K]> },
  { readonly [K in keyof REFS]: OutputOf<REFS[K]> }
> {
  return {
    get: Effect.zipAll(refs.map((ref) => ref.get)),
    set: (values: readonly [InputOf<REFS[number]>]) =>
      Effect.zipAll(refs.map((ref, i) => ref.set(values[i]))),
    delete: pipe(
      Effect.zipAll(refs.map((ref) => ref.delete)),
      Effect.map((options) => Option.tuple(...options)),
    ),
  } as Ref<
    ResourcesOf<REFS[number]>,
    ErrorsOf<REFS[number]>,
    { readonly [K in keyof REFS]: InputOf<REFS[K]> },
    { readonly [K in keyof REFS]: OutputOf<REFS[K]> }
  >
}

export function struct<REFS extends Readonly<Record<string, Ref<any, any, any>>>>(
  refs: REFS,
): Ref<
  ResourcesOf<REFS[string]>,
  ErrorsOf<REFS[string]>,
  { readonly [K in keyof REFS]: InputOf<REFS[K]> },
  { readonly [K in keyof REFS]: OutputOf<REFS[K]> }
> {
  return {
    get: Effect.struct(mapObject(refs, (r) => r.get)),
    set: (values: { readonly [K in keyof REFS]: InputOf<REFS[K]> }) =>
      Effect.struct(mapObject(refs, (r, k) => r.set(values[k]))),
    delete: pipe(Effect.struct(mapObject(refs, (r) => r.delete)), Effect.map(Option.struct)),
  } as Ref<
    ResourcesOf<REFS[string]>,
    ErrorsOf<REFS[string]>,
    { readonly [K in keyof REFS]: InputOf<REFS[K]> },
    { readonly [K in keyof REFS]: OutputOf<REFS[K]> }
  >
}

function mapObject<A, B>(object: Readonly<Record<string, A>>, f: (a: A, k: string) => B) {
  return Object.fromEntries(Object.entries(object).map(([k, v]) => [k, f(v, k)]))
}

export function provide<R>(ctx: Context.Context<R>) {
  return <E, A>(ref: Ref<R, E, A>): Ref<never, E, A> => ({
    get: pipe(ref.get, Effect.provide(ctx)),
    set: flow(ref.set, Effect.provide(ctx)),
    delete: pipe(ref.delete, Effect.provide(ctx)),
  })
}

export function provideSome<R2>(ctx: Context.Context<R2>) {
  return <R, E, A>(ref: Ref<R | R2, E, A>): Ref<Exclude<R, R2>, E, A> => ({
    get: pipe(ref.get, Effect.provideSome(Context.merge(ctx))),
    set: flow(ref.set, Effect.provideSome(Context.merge(ctx))),
    delete: pipe(ref.delete, Effect.provideSome(Context.merge(ctx))),
  })
}

export function imap<A, B>(to: (a: A) => B, from: (b: B) => A) {
  return <R, E>(ref: Ref<R, E, A>): Ref<R, E, B> => ({
    get: pipe(ref.get, Effect.map(to)),
    set: flow(from, ref.set, Effect.map(to)),
    delete: pipe(ref.delete, Effect.map(Option.map(to))),
  })
}

export function compose<R2, E2, I2, B>(that: Ref<R2, E2, I2, B>) {
  return <R, E, A>(self: Ref<R, E, A, I2>): Ref<R | R2, E | E2, A, B> => ({
    get: that.get,
    set: flow(self.set, Effect.flatMap(that.set)),
    delete: pipe(
      self.delete,
      Effect.flatMap(() => that.delete),
    ),
  })
}

export function provideLayer<R2, E2, I2, O2>(layer: Layer<R2, E2, I2, O2>) {
  return <R, E, I, O>(ref: Ref<R, E, I, O>): Ref<R2 | Exclude<R, O2>, E | E2, I, O> => ({
    get: pipe(ref.get, Effect.provideLayer(layer)),
    set: flow(ref.set, Effect.provideLayer(layer)),
    delete: pipe(ref.delete, Effect.provideLayer(layer)),
  })
}
