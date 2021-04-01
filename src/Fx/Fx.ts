import { Applicative2 } from 'fp-ts/Applicative'
import { Apply2 } from 'fp-ts/Apply'
import { ap as ap_ } from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import { Either, isLeft } from 'fp-ts/Either'
import { FromIO2 } from 'fp-ts/FromIO'
import { Functor2 } from 'fp-ts/Functor'
import { IO } from 'fp-ts/IO'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'
import { A } from 'ts-toolbelt'

/**
 * Fx is a generator-based abstraction for do-notation for any single-shot
 * effect. Due to the mutable nature of generators however, we cannot support this syntax
 * for multi-shot effects like reactive Streams/Observables. Most of the effects you
 * likely use are single-shot like Option/Either/Task.
 *
 * An Fx is a set of Effects which are being `yield`ed from the Generator.
 * This can be a powerful way to construct algorithms separate from their interpretation.
 *
 * Fx's Result parameter is the secret to getting type-safety by using yield* when running an Fx.
 */
export interface Fx<Effects, Result, Next = unknown> {
  readonly [Symbol.iterator]: () => Generator<Effects, Result, Next>
}

/**
 * Extract the effects being performed within an Fx
 */
export type GetEffects<A> = A extends Fx<infer R, any, any>
  ? IsNever<R> extends false
    ? R
    : unknown
  : unknown

type IsNever<A> = A.Equals<[never], [A]> extends 1 ? true : false

/**
 * Extract the result being performed within an Fx
 */
export type GetResult<A> = A extends Fx<any, infer R, any> ? R : never

/**
 * Extract the values being returned to the internal Fx
 */
export type GetNext<A> = A extends Fx<any, any, infer R> ? R : never

export function doFx<G extends Generator<any, any, any>>(
  generatorFn: () => G,
): Fx<GetEffects<G>, GetResult<G>, GetNext<G>> {
  return {
    [Symbol.iterator]: generatorFn,
  }
}

/**
 * An Fx which has no Effects or they have all been accounted for.
 */
export interface Pure<A> extends Fx<never, A> {}

export const pure = <A>(value: A): Pure<A> =>
  // eslint-disable-next-line require-yield
  doFx(function* () {
    return value
  })

export const fromIO = <A>(io: IO<A>): Pure<A> =>
  // eslint-disable-next-line require-yield
  doFx(function* () {
    return io()
  })

export const URI = '@typed/fp/Fx'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: Fx<E, A>
  }
}

export const map = <A, B>(f: (value: A) => B) => <E>(fa: Fx<E, A>): Fx<E, B> =>
  doFx(function* () {
    return f(yield* fa)
  })

export const Functor: Functor2<URI> = {
  URI,
  map,
}

export const of = pure

export const Pointed: Pointed2<URI> = {
  of,
}

export const chain = <A, E1, B>(f: (value: A) => Fx<E1, B>) => <E2>(
  fa: Fx<E2, A>,
): Fx<E1 | E2, B> =>
  doFx(function* () {
    const a = yield* fa

    return yield* f(a)
  })

export const Monad: Monad2<URI> = {
  ...Pointed,
  ...Functor,
  chain,
}

export const chainRec = <A, E, B>(f: (value: A) => Fx<E, Either<A, B>>) => (value: A): Fx<E, B> =>
  doFx(function* () {
    let either = yield* f(value)

    while (isLeft(either)) {
      either = yield* f(either.left)
    }

    return either.right
  })

export const ChainRec: ChainRec2<URI> = {
  URI,
  chainRec,
}

export const ap = ap_(Monad) as <E1, A>(
  fa: Fx<E1, A, unknown>,
) => <E2, B>(fab: Fx<E2, (a: A) => B, unknown>) => Fx<E1 | E2, B, unknown>

export const Apply: Apply2<URI> = { ...Functor, ap }

export const Applicative: Applicative2<URI> = { ...Pointed, ...Apply }

export const FromIO: FromIO2<URI> = { URI, fromIO }
