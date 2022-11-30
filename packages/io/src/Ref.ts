import { flow, pipe } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'

import * as Effect from './Effect.js'
import * as FiberRef from './FiberRef.js'

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

export function fromFiberRef<R, E, A>(fiberRef: FiberRef.FiberRef<R, E, A>): Ref<R, E, A> {
  return {
    get: Effect.getFiberRef(fiberRef),
    set: (a) => Effect.setFiberRef(a)(fiberRef),
    delete: Effect.deleteFiberRef(fiberRef),
  }
}

export const make = flow(FiberRef.FiberRef, fromFiberRef)

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
