/**
 * Decoder is a data structure for representing runtime representations of your types.
 * @since 0.9.4
 */
import * as App from 'fp-ts/Applicative'
import * as Ap from 'fp-ts/Apply'
import * as Ch from 'fp-ts/Chain'
import * as Ei from 'fp-ts/Either'
import * as F from 'fp-ts/Functor'
import { IO } from 'fp-ts/IO'
import { Monad2 } from 'fp-ts/Monad'
import * as N from 'fp-ts/number'
import { Pointed2 } from 'fp-ts/Pointed'
import { not, Predicate } from 'fp-ts/Predicate'
import * as RA from 'fp-ts/ReadonlyArray'
import { concatW } from 'fp-ts/ReadonlyNonEmptyArray'
import { Refinement } from 'fp-ts/Refinement'
import * as S from 'fp-ts/string'
import { getAssignSemigroup } from 'fp-ts/struct'
import * as T from 'fp-ts/These'

import * as DE from './DecodeError'
import { pipe } from './function'
import { make } from './struct'

/**
 * @category Model
 * @since 0.9.4
 */
export interface Decoder<I, O> {
  readonly decode: (input: I) => T.These<DE.DecodeErrors, O>
}

/**
 * @category Type-level
 * @since 0.9.4
 */
export type InputOf<A> = [A] extends [Decoder<infer I, any>] ? I : never

/**
 * @category Type-level
 * @since 0.9.4
 */
export type OutputOf<A> = [A] extends [Decoder<any, infer O>] ? O : never

/**
 * @category Constructor
 * @since 0.9.4
 */
export function fromRefinement<I, O extends I>(
  refinement: Refinement<I, O>,
  expected: string,
): Decoder<I, O> {
  return {
    decode: (i) => (refinement(i) ? T.right(i) : T.left([DE.leaf(i, expected)])),
  }
}

/**
 * @category Constructor
 * @since 0.9.4
 */
export const string = fromRefinement((x: unknown): x is string => typeof x === 'string', 'string')

/**
 * @category Constructor
 * @since 0.9.4
 */
export const number = fromRefinement((x: unknown): x is number => typeof x === 'number', 'number')

/**
 * @category Constructor
 * @since 0.9.4
 */
export const boolean = fromRefinement(
  (x: unknown): x is boolean => typeof x === 'boolean',
  'boolean',
)

/**
 * @category Constructor
 * @since 0.9.4
 */
export const union =
  <I, O1>(second: Decoder<I, O1>) =>
  <O2>(first: Decoder<I, O2>): Decoder<I, O1 | O2> => {
    const { concat } = DE.getSemigroup()

    return {
      decode: (i) =>
        pipe(
          i,
          first.decode,
          T.mapLeft((errors) => [DE.member(0, errors)] as const),
          T.matchW(
            (e1) =>
              pipe(
                i,
                second.decode,
                T.mapLeft((errors) => [DE.member(1, errors)] as const),
                T.matchW(
                  (e2) => pipe(e1, concat(e2), T.left),
                  T.right,
                  (e2, a) => T.both(pipe(e1, concat(e2)), a),
                ),
              ),
            T.right,
            (e1, o1) =>
              pipe(
                i,
                second.decode,
                T.mapLeft((errors) => [DE.member(1, errors)] as const),
                T.matchW(
                  (e2) => T.both(pipe(e1, concat(e2)), o1),
                  T.right,
                  (e2) => T.both(pipe(e1, concat(e2)), o1),
                ),
              ),
          ),
        ) as T.These<DE.DecodeErrors, O1 | O2>,
    }
  }

/**
 * @category Combinator
 * @since 0.9.4
 */
export const nullable = union(fromRefinement((x): x is null => x === null, 'null'))

/**
 * @category Combinator
 * @since 0.9.4
 */
export const optional = union(fromRefinement((x): x is undefined => x === undefined, 'undefined'))

/**
 * @category Constructor
 * @since 0.9.4
 */
export const unknownArray = fromRefinement<unknown, ReadonlyArray<unknown>>(
  Array.isArray,
  'Array<unknown>',
)

/**
 * @category Constructor
 * @since 0.9.4
 */
export const unknownRecord = fromRefinement<unknown, { readonly [key: string]: unknown }>(
  (x): x is { readonly [key: string]: unknown } =>
    !!x && !Array.isArray(x) && typeof x === 'object',
  'Record<string, unknown>',
)

/**
 * @category Combinator
 * @since 0.9.4
 */
export const compose =
  <A, O>(second: Decoder<A, O>) =>
  <I>(first: Decoder<I, A>): Decoder<I, O> => {
    const { chain } = T.getChain(DE.getSemigroup())

    return {
      decode: (i) => pipe(i, first.decode, chain(second.decode)),
    }
  }

/**
 * @category Constructor
 * @since 0.9.4
 */
export const fromArray = <I, O>(member: Decoder<I, O>): Decoder<readonly I[], readonly O[]> => {
  const { concat } = T.getSemigroup(DE.getSemigroup(), RA.getSemigroup<O>())

  return {
    decode: (inputs) => {
      const [first, ...rest] = inputs.map((input, index) =>
        pipe(
          input,
          member.decode,
          T.mapLeft((e): DE.DecodeErrors => [DE.index(index, e)] as const),
          T.map((o): readonly O[] => [o]),
        ),
      )

      return rest.reduce((acc, x) => pipe(x, concat(acc)), first)
    },
  }
}

/**
 * @category Constructor
 * @since 0.9.4
 */
export const array = <I, O>(member: Decoder<I, O>) => pipe(fromArray(member), compose(unknownArray))

/**
 * @category Constructor
 * @since 0.9.4
 */
export const fromStruct = <A extends { readonly [key: string]: Decoder<unknown, any> }>(
  properties: A,
): Decoder<Readonly<Record<string, unknown>>, { readonly [K in keyof A]: OutputOf<A[K]> }> => {
  type O = { readonly [K in keyof A]: OutputOf<A[K]> }

  const { concat } = T.getSemigroup(DE.getSemigroup(), getAssignSemigroup<any>())

  return {
    decode: (i) => {
      const expectedKeys = Object.keys(properties)
      const remainingKeys = expectedKeys.filter((k) => k in i)
      const [first, ...rest] = remainingKeys.map((k) =>
        pipe(
          properties[k].decode(i[k]),
          T.mapLeft((e): DE.DecodeErrors => [DE.key(k, e)] as const),
          T.map((o: O[keyof O]) => make(k, o)),
        ),
      )
      const result = rest.reduce((acc, x) => pipe(x, concat(acc)), first)

      return result as T.These<DE.DecodeErrors, O>
    },
  }
}

/**
 * @category Constructor
 * @since 0.9.4
 */
export function missingKeys<A extends { readonly [key: string]: Decoder<unknown, any> }>(
  properties: A,
): Decoder<Readonly<Record<string, unknown>>, { readonly [K in keyof A]: OutputOf<A[K]> }> {
  type O = { readonly [K in keyof A]: OutputOf<A[K]> }
  const diff = RA.difference(S.Eq)

  return {
    decode: (i) => {
      const expectedKeys = Object.keys(properties)
      const actualKeys = Object.keys(i)
      const missingKeys = pipe(expectedKeys, diff(actualKeys))
      const result = RA.isNonEmpty(missingKeys)
        ? T.both([DE.missingKeys([missingKeys[0], ...missingKeys.slice(1)])] as const, i as O)
        : T.right(i as O)

      return result
    },
  }
}

/**
 * @category Constructor
 * @since 0.9.4
 */
export function unexpectedKeys<A extends { readonly [key: string]: Decoder<unknown, any> }>(
  properties: A,
): Decoder<Readonly<Record<string, unknown>>, { readonly [K in keyof A]: OutputOf<A[K]> }> {
  type O = { readonly [K in keyof A]: OutputOf<A[K]> }
  const diff = RA.difference(S.Eq)

  return {
    decode: (i) => {
      const expectedKeys = Object.keys(properties)
      const actualKeys = Object.keys(i)
      const unexpectedKeys = pipe(actualKeys, diff(expectedKeys))
      const result = RA.isNonEmpty(unexpectedKeys)
        ? T.both(
            [DE.unexpectedKeys([unexpectedKeys[0], ...unexpectedKeys.slice(1)])] as const,
            i as O,
          )
        : T.right(i as O)

      return result
    },
  }
}

/**
 * @category Constructor
 * @since 0.9.4
 */
export function struct<A extends { readonly [key: string]: Decoder<unknown, any> }>(
  properties: A,
): Decoder<unknown, { readonly [K in keyof A]: OutputOf<A[K]> }> {
  return pipe(
    unknownRecord,
    compose(missingKeys(properties)),
    compose(unexpectedKeys(properties)),
    compose(fromStruct(properties)),
  )
}

/**
 * @category Constructor
 * @since 0.9.4
 */
export function fromTuple<A extends readonly [Decoder<any, any>, ...Decoder<any, any>[]]>(
  ...tuple: A
): Decoder<readonly unknown[], { readonly [K in keyof A]: OutputOf<A[K]> }> {
  type O = { readonly [K in keyof A]: OutputOf<A[K]> }

  const { concat } = T.getSemigroup(DE.getSemigroup(), RA.getSemigroup<O>())

  return {
    decode: (input) => {
      const [first, ...rest] = tuple.map((d, i) =>
        pipe(
          d.decode(input[i]),
          T.mapLeft((errors): DE.DecodeErrors => [DE.index(i, errors)]),
          T.map((o): readonly O[] => [o]),
        ),
      )
      const result = rest.reduce((acc, x) => pipe(x, concat(acc)), first)

      return result as T.These<DE.DecodeErrors, O>
    },
  }
}

/**
 * @category Constructor
 * @since 0.9.4
 */
export function missingIndexes<A extends readonly [Decoder<any, any>, ...Decoder<any, any>[]]>(
  ...tuple: A
): Decoder<readonly unknown[], readonly unknown[]> {
  const diff = RA.difference(N.Eq)

  return {
    decode: (i) => {
      const expectedKeys = Object.keys(tuple).map(parseFloat)
      const actualKeys = Object.keys(i).map(parseFloat)
      const missingKeys = pipe(expectedKeys, diff(actualKeys))
      const result = RA.isNonEmpty(missingKeys)
        ? T.both([DE.missingIndexes([missingKeys[0], ...missingKeys.slice(1)])] as const, i)
        : T.right(i)

      return result
    },
  }
}

/**
 * @category Constructor
 * @since 0.9.4
 */
export function unexpectedIndexes<A extends readonly [Decoder<any, any>, ...Decoder<any, any>[]]>(
  ...tuple: A
): Decoder<readonly unknown[], readonly unknown[]> {
  const diff = RA.difference(S.Eq)

  return {
    decode: (i) => {
      const expectedKeys = Object.keys(tuple)
      const actualKeys = Object.keys(i)
      const unexpectedKeys = pipe(actualKeys, diff(expectedKeys))
      const result = RA.isNonEmpty(unexpectedKeys)
        ? T.both([DE.unexpectedKeys([unexpectedKeys[0], ...unexpectedKeys.slice(1)])] as const, i)
        : T.right(i)

      return result
    },
  }
}

/**
 * @category Constructor
 * @since 0.9.4
 */
export function tuple<A extends readonly [Decoder<any, any>, ...Decoder<any, any>[]]>(
  ...tuple: A
): Decoder<unknown, { readonly [K in keyof A]: OutputOf<A[K]> }> {
  return pipe(
    unknownArray,
    compose(missingIndexes(...tuple)),
    compose(unexpectedIndexes(...tuple)),
    compose(fromTuple(...tuple)),
  ) as Decoder<unknown, { readonly [K in keyof A]: OutputOf<A[K]> }>
}

/**
 * @category URI
 * @since 0.9.4
 */
export const URI = '@typed/fp/Decoder'
/**
 * @category URI
 * @since 0.9.4
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: Decoder<E, A>
  }
}

/**
 * @category Constructor
 * @since 0.9.4
 */
export const of = <A>(value: A): Decoder<unknown, A> => ({
  decode: () => T.right(value),
})

/**
 * @category Combinator
 * @since 0.9.4
 */
export const map =
  <A, B>(f: (value: A) => B) =>
  <I>(decoder: Decoder<I, A>): Decoder<I, B> => ({
    decode: (i) => pipe(i, decoder.decode, T.map(f)),
  })

/**
 * @category Combinator
 * @since 0.9.4
 */
export function condemnWhen(predicate: Predicate<DE.DecodeError>) {
  return <I, A>(decoder: Decoder<I, A>): Decoder<I, A> => ({
    decode: (i) =>
      pipe(
        i,
        decoder.decode,
        T.matchW(T.left, T.right, (errors, a): T.These<DE.DecodeErrors, A> => {
          const { left: absolved, right: condemned } = pipe(
            errors,
            RA.map(Ei.fromPredicate(predicate)),
            RA.separate,
          )

          return RA.isNonEmpty(condemned)
            ? T.left(condemned)
            : RA.isNonEmpty(absolved)
            ? T.both(absolved, a)
            : T.right(a)
        }),
      ),
  })
}

/**
 * @category Combinator
 * @since 0.9.4
 */
export const condemn = condemnWhen(() => true)

/**
 * @category Combinator
 * @since 0.9.4
 */
export function absolveWhen(predicate: Predicate<DE.DecodeError>) {
  return <I, A>(decoder: Decoder<I, A>): Decoder<I, A> => ({
    decode: (i) =>
      pipe(
        i,
        decoder.decode,
        T.matchW(T.left, T.right, (errors, a): T.These<DE.DecodeErrors, A> => {
          const { left: condemned, right: absolved } = pipe(
            errors,
            RA.map(Ei.fromPredicate(not(predicate))),
            RA.separate,
          )

          return RA.isNonEmpty(absolved)
            ? T.right(a)
            : RA.isNonEmpty(condemned)
            ? T.both(condemned, a)
            : T.right(a)
        }),
      ),
  })
}

/**
 * @category Combinator
 * @since 0.9.4
 */
export const absolve = absolveWhen(() => true)

/**
 * @category Combinator
 * @since 0.9.4
 */
export const condemnUnexpectedKeys = condemnWhen((d) => d._tag === 'UnexpectedKeys')

/**
 * @category Combinator
 * @since 0.9.4
 */
export const condemmMissingKeys = condemnWhen((d) => d._tag === 'MissingKeys')

/**
 * @category Combinator
 * @since 0.9.4
 */
export const strict = condemnWhen((d) => d._tag === 'UnexpectedKeys' || d._tag === 'MissingKeys')

/**
 * @category Instance
 * @since 0.9.4
 */
export const Pointed: Pointed2<URI> = {
  of,
}

/**
 * @category Instance
 * @since 0.9.4
 */
export const Functor: F.Functor2<URI> = {
  map,
}

/**
 * @category Combinator
 * @since 0.9.4
 */
export const bindTo = F.bindTo(Functor)
/**
 * @category Combinator
 * @since 0.9.4
 */
export const flap = F.flap(Functor)
/**
 * @category Combinator
 * @since 0.9.4
 */
export const tupled = F.tupled(Functor)

/**
 * @category Constructor
 * @since 0.9.4
 */
export const fromIO = <A>(io: IO<A>): Decoder<unknown, {}> => ({
  decode: () => T.right(io()),
})

/**
 * @category Combinator
 * @since 0.9.4
 */
export const chain =
  <A, I, B>(f: (a: A) => Decoder<I, B>) =>
  (decoder: Decoder<I, A>): Decoder<I, B> => ({
    decode: (i) =>
      pipe(
        i,
        decoder.decode,
        T.matchW(
          T.left,
          (a) => f(a).decode(i),
          (errors, a) => pipe(i, f(a).decode, T.mapLeft(concatW(errors))),
        ),
      ),
  })

/**
 * @category Constructor
 * @since 0.9.4
 */
export const Chain: Ch.Chain2<URI> = {
  map,
  chain,
}

/**
 * @category Combinator
 * @since 0.9.4
 */
export const ap = Ch.ap(Chain)
/**
 * @category Combinator
 * @since 0.9.4
 */
export const chainFirst = Ch.chainFirst(Chain)
/**
 * @category Combinator
 * @since 0.9.4
 */
export const bind = Ch.bind(Chain)

/**
 * @category Instance
 * @since 0.9.4
 */
export const Apply: Ap.Apply2<URI> = {
  map,
  ap,
}

/**
 * @category Combinator
 * @since 0.9.4
 */
export const apFirst = Ap.apFirst(Apply)
/**
 * @category Combinator
 * @since 0.9.4
 */
export const apS = Ap.apS(Apply)
/**
 * @category Combinator
 * @since 0.9.4
 */
export const apSecond = Ap.apSecond(Apply)
/**
 * @category Combinator
 * @since 0.9.4
 */
export const apT = Ap.apT(Apply)
/**
 * @category Typeclass Constructor
 * @since 0.9.4
 */
export const getApplySemigroup = Ap.getApplySemigroup(Apply)

/**
 * @category Instance
 * @since 0.9.4
 */
export const Applicative: App.Applicative2<URI> = {
  of,
  ...Apply,
}

/**
 * @category Combinator
 * @since 0.9.4
 */
export const getApplicativeMonoid = App.getApplicativeMonoid(Applicative)

/**
 * @category Constructor
 * @since 0.9.4
 */
export const Do: Decoder<unknown, {}> = fromIO(() => Object.create(null))

/**
 * @category Instance
 * @since 0.9.4
 */
export const Monad: Monad2<URI> = {
  ...Pointed,
  ...Chain,
}
