/**
 * Guard is a Typeclass for expressing Refinements
 *
 * @since 0.9.5
 */
import { identity, pipe } from 'fp-ts/function'
import { Refinement } from 'fp-ts/Refinement'

import { Literal, memoize, Schemable1, WithRefine1, WithUnion1 } from './Schemable'

// -------------------------------------------------------------------------------------
// Model
// -------------------------------------------------------------------------------------

/**
 * @category Model
 * @since 0.9.5
 */
export interface Guard<I, A extends I> {
  is: (i: I) => i is A
}

// -------------------------------------------------------------------------------------
// utils
// -------------------------------------------------------------------------------------

/**
 * @since 2.2.2
 */
export type TypeOf<G> = G extends Guard<any, infer A> ? A : never

/**
 * @since 0.9.5
 */
export type InputOf<G> = G extends Guard<infer I, any> ? I : never

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

/**
 * @category constructors
 * @since 0.9.5
 */
export const literal = <A extends readonly [Literal, ...Array<Literal>]>(
  ...values: A
): Guard<unknown, A[number]> => ({
  is: (u: unknown): u is A[number] => values.findIndex((a) => a === u) !== -1,
})

// -------------------------------------------------------------------------------------
// Decoder
// -------------------------------------------------------------------------------------

/**
 * @category Decoder
 * @since 0.9.5
 */
export const string: Guard<unknown, string> = {
  is: (u: unknown): u is string => typeof u === 'string',
}

/**
 * Note: `NaN` is excluded.
 *
 * @category Decoder
 * @since 0.9.5
 */
export const number: Guard<unknown, number> = {
  is: (u: unknown): u is number => typeof u === 'number' && !isNaN(u),
}

/**
 * @category Decoder
 * @since 0.9.5
 */
export const boolean: Guard<unknown, boolean> = {
  is: (u: unknown): u is boolean => typeof u === 'boolean',
}

/**
 * @category Decoder
 * @since 0.9.5
 */
export const date: Guard<unknown, Date> = {
  is: (u: unknown): u is Date => u instanceof Date,
}

/**
 * @category Decoder
 * @since 0.9.5
 */
export const unknownArray: Guard<unknown, Array<unknown>> = {
  is: Array.isArray,
}

/**
 * @category Decoder
 * @since 0.9.5
 */
export const unknownRecord: Guard<unknown, Record<string, unknown>> = {
  is: (u: unknown): u is Record<string, unknown> =>
    u !== null && typeof u === 'object' && !Array.isArray(u),
}

// -------------------------------------------------------------------------------------
// Combinator
// -------------------------------------------------------------------------------------

/**
 * @category Combinator
 * @since 0.9.5
 */
export const refine =
  <I, A extends I, B extends A>(refinement: Refinement<A, B>) =>
  (from: Guard<I, A>): Guard<I, B> => ({
    is: (i: I): i is B => from.is(i) && refinement(i),
  })

/**
 * @category Combinator
 * @since 0.9.5
 */
export const nullable = <I, A extends I>(or: Guard<I, A>): Guard<null | I, null | A> => ({
  is: (i): i is null | A => i === null || or.is(i),
})

/**
 * @category Combinator
 * @since 2.2.15
 */
export const struct = <A>(
  properties: { [K in keyof A]: Guard<unknown, A[K]> },
): Guard<unknown, { [K in keyof A]: A[K] }> =>
  pipe(
    unknownRecord,
    refine(
      (
        r,
      ): r is {
        [K in keyof A]: A[K]
      } => {
        for (const k in properties) {
          if (!(k in r) || !properties[k].is(r[k])) {
            return false
          }
        }
        return true
      },
    ),
  )

/**
 * Use `struct` instead.
 *
 * @category Combinator
 * @since 0.9.5
 * @deprecated
 */
export const type = struct

/**
 * @category Combinator
 * @since 0.9.5
 */
export const partial = <A>(
  properties: { [K in keyof A]: Guard<unknown, A[K]> },
): Guard<unknown, Partial<{ [K in keyof A]: A[K] }>> =>
  pipe(
    unknownRecord,
    refine((r): r is Partial<A> => {
      for (const k in properties) {
        const v = r[k]
        if (v !== undefined && !properties[k].is(v)) {
          return false
        }
      }
      return true
    }),
  )

/**
 * @category Combinator
 * @since 0.9.5
 */
export const array = <A>(item: Guard<unknown, A>): Guard<unknown, Array<A>> =>
  pipe(
    unknownArray,
    refine((us): us is Array<A> => us.every(item.is)),
  )

/**
 * @category Combinator
 * @since 0.9.5
 */
export const record = <A>(codomain: Guard<unknown, A>): Guard<unknown, Record<string, A>> =>
  pipe(
    unknownRecord,
    refine((r): r is Record<string, A> => {
      for (const k in r) {
        if (!codomain.is(r[k])) {
          return false
        }
      }
      return true
    }),
  )

/**
 * @category Combinator
 * @since 0.9.5
 */
export const tuple = <A extends ReadonlyArray<unknown>>(
  ...components: { [K in keyof A]: Guard<unknown, A[K]> }
): Guard<unknown, A> => ({
  is: (u): u is A =>
    Array.isArray(u) && u.length === components.length && components.every((c, i) => c.is(u[i])),
})

/**
 * @category Combinator
 * @since 0.9.5
 */
export const intersect =
  <B>(right: Guard<unknown, B>) =>
  <A>(left: Guard<unknown, A>): Guard<unknown, A & B> => ({
    is: (u: unknown): u is A & B => left.is(u) && right.is(u),
  })

/**
 * @category Combinator
 * @since 0.9.5
 */
export const union =
  <A>(second: Guard<unknown, A>) =>
  <B>(first: Guard<unknown, B>): Guard<unknown, A | B> => ({
    is: (u: unknown): u is A | B => first.is(u) || second.is(u),
  })

/**
 * @category Combinator
 * @since 0.9.5
 */
export const sum =
  <T extends string>(tag: T) =>
  <A>(
    members: { [K in keyof A]: Guard<unknown, A[K] & Record<T, K>> },
  ): Guard<unknown, A[keyof A]> =>
    pipe(
      unknownRecord,
      refine((r): r is any => {
        const v = r[tag] as keyof A
        if (v in members) {
          return members[v].is(r)
        }
        return false
      }),
    )

/**
 * @category Combinator
 * @since 0.9.5
 */
export const lazy = <A>(f: () => Guard<unknown, A>): Guard<unknown, A> => {
  const get = memoize<void, Guard<unknown, A>>(f)
  return {
    is: (u: unknown): u is A => get().is(u),
  }
}

/**
 * @category Combinator
 * @since 2.2.15
 */
export const readonly: <I, A extends I>(guard: Guard<I, A>) => Guard<I, Readonly<A>> = identity

/**
 * @category Combinator
 * @since 0.9.5
 */
export const alt =
  <I, A extends I>(that: () => Guard<I, A>) =>
  (me: Guard<I, A>): Guard<I, A> => ({
    is: (i): i is A => me.is(i) || that().is(i),
  })

/**
 * @category Combinator
 * @since 0.9.5
 */
export const zero = <I, A extends I>(): Guard<I, A> => ({
  is: (_): _ is A => false,
})

/**
 * @category Combinator
 * @since 0.9.5
 */
export const compose =
  <I, A extends I, B extends A>(to: Guard<A, B>) =>
  (from: Guard<I, A>): Guard<I, B> => ({
    is: (i): i is B => from.is(i) && to.is(i),
  })

/**
 * @category Combinator
 * @since 0.9.5
 */
export const id = <A>(): Guard<A, A> => ({
  is: (_): _ is A => true,
})

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

/**
 * @category instances
 * @since 0.9.5
 */
export const URI = '@typed/fp/Guard'

/**
 * @category instances
 * @since 0.9.5
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  interface URItoKind<A> {
    readonly [URI]: Guard<unknown, A>
  }
}

/**
 * @category instances
 * @since 0.9.5
 */
export const Schemable: Schemable1<URI> = {
  URI,
  literal,
  string,
  number,
  boolean,
  date,
  nullable,
  struct,
  record,
  array,
  tuple: tuple as Schemable1<URI>['tuple'],
  intersect,
  sum,
  lazy: (_, f) => lazy(f),
  branded: identity as Schemable1<URI>['branded'],
  unknownArray,
  unknownRecord,
}

/**
 * @category instances
 * @since 0.9.5
 */
export const WithUnion: WithUnion1<URI> = {
  union,
}

/**
 * @category instances
 * @since 0.9.5
 */
export const WithRefine: WithRefine1<URI> = {
  refine: refine as WithRefine1<URI>['refine'],
}
