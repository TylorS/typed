/**
 * Encoder is a data type for representing runtime representations of your types.
 *
 * *Note*: This will be deprecated in favor of a version of io-ts which support fp-ts v3
 * @since 0.14.1
 */
import { Category2 } from 'fp-ts/Category'
import { Contravariant2 } from 'fp-ts/Contravariant'
import { identity } from 'fp-ts/function'

import { memoize } from './Schemable'

/**
 * @category Model
 * @since 0.14.1
 */
export interface Encoder<O, A> {
  readonly encode: (a: A) => O
}

/**
 * @category Combinator
 * @since 0.14.1
 */
export function nullable<O, A>(or: Encoder<O, A>): Encoder<null | O, null | A> {
  return {
    encode: (a) => (a === null ? null : or.encode(a)),
  }
}

/**
 * @category Combinator
 * @since 2.2.15
 */
export function struct<P extends Record<string, Encoder<any, any>>>(
  properties: P,
): Encoder<{ [K in keyof P]: OutputOf<P[K]> }, { [K in keyof P]: TypeOf<P[K]> }> {
  return {
    encode: (a) => {
      const o: Record<keyof P, any> = {} as any
      for (const k in properties) {
        o[k] = properties[k].encode(a[k])
      }
      return o
    },
  }
}

/**
 * @category Combinator
 * @since 0.14.1
 */
export function partial<P extends Record<string, Encoder<any, any>>>(
  properties: P,
): Encoder<Partial<{ [K in keyof P]: OutputOf<P[K]> }>, Partial<{ [K in keyof P]: TypeOf<P[K]> }>> {
  return {
    encode: (a) => {
      const o: Record<keyof P, any> = {} as any
      for (const k in properties) {
        const v = a[k]
        // don't add missing properties
        if (k in a) {
          // don't strip undefined properties
          o[k] = v === undefined ? undefined : properties[k].encode(v)
        }
      }
      return o
    },
  }
}

/**
 * @category Combinator
 * @since 0.14.1
 */
export function record<O, A>(
  codomain: Encoder<O, A>,
): Encoder<Record<string, O>, Record<string, A>> {
  return {
    encode: (r) => {
      const o: Record<string, O> = {}
      for (const k in r) {
        o[k] = codomain.encode(r[k])
      }
      return o
    },
  }
}

/**
 * @category Combinator
 * @since 0.14.1
 */
export function array<O, A>(item: Encoder<O, A>): Encoder<ReadonlyArray<O>, ReadonlyArray<A>> {
  return {
    encode: (as) => as.map(item.encode),
  }
}

/**
 * @category Combinator
 * @since 0.14.1
 */
export function tuple<C extends ReadonlyArray<Encoder<any, any>>>(
  ...components: C
): Encoder<{ [K in keyof C]: OutputOf<C[K]> }, { [K in keyof C]: TypeOf<C[K]> }> {
  return {
    encode: (as) => components.map((c, i) => c.encode(as[i])) as any,
  }
}

/**
 * @category Combinator
 * @since 0.14.1
 */
export const intersect =
  <P, B>(right: Encoder<P, B>) =>
  <O, A>(left: Encoder<O, A>): Encoder<O & P, A & B> => ({
    encode: (ab) => ({ ...left.encode(ab), ...right.encode(ab) }),
  })

/**
 * @category Combinator
 * @since 0.14.1
 */
export function sum<T extends string>(
  tag: T,
): <MS extends Record<string, Encoder<any, any>>>(
  members: MS,
) => Encoder<OutputOf<MS[keyof MS]>, TypeOf<MS[keyof MS]>> {
  return (members) => {
    return {
      encode: (a) => members[a[tag]].encode(a),
    }
  }
}

/**
 * @category Combinator
 * @since 0.14.1
 */
export function lazy<O, A>(f: () => Encoder<O, A>): Encoder<O, A> {
  const get = memoize<void, Encoder<O, A>>(f)
  return {
    encode: (a) => get().encode(a),
  }
}

/**
 * @category Combinator
 * @since 0.14.1
 */
export const readonly: <O, A>(decoder: Encoder<O, A>) => Encoder<O, Readonly<A>> = identity

// -------------------------------------------------------------------------------------
// non-pipeables
// -------------------------------------------------------------------------------------

const contramap_: <E, A, B>(ea: Encoder<E, A>, f: (b: B) => A) => Encoder<E, B> = (ea, f) => ({
  encode: (b) => ea.encode(f(b)),
})

const compose_: <E, A, B>(ab: Encoder<A, B>, ea: Encoder<E, A>) => Encoder<E, B> = (ab, ea) =>
  contramap_(ea, ab.encode)

// -------------------------------------------------------------------------------------
// pipeables
// -------------------------------------------------------------------------------------

/**
 * @category Contravariant
 * @since 0.14.1
 */
export const contramap: <A, B>(f: (b: B) => A) => <E>(fa: Encoder<E, A>) => Encoder<E, B> =
  (f) => (fa) =>
    contramap_(fa, f)

/**
 * @category Semigroupoid
 * @since 0.14.1
 */
export const compose: <A, B>(ab: Encoder<A, B>) => <E>(ea: Encoder<E, A>) => Encoder<E, B> =
  (ab) => (ea) =>
    compose_(ab, ea)

/**
 * @category Category
 * @since 0.14.1
 */
export function id<A>(): Encoder<A, A> {
  return {
    encode: identity,
  }
}

/**
 * @category URI
 * @since 0.14.1
 */
export const URI = '@typed/fp/Encoder'

/**
 * @category URI
 * @since 0.14.1
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  interface URItoKind2<E, A> {
    readonly [URI]: Encoder<E, A>
  }
}

/**
 * @category Instance
 * @since 0.14.1
 */
export const Contravariant: Contravariant2<URI> = {
  URI,
  contramap,
}

/**
 * @category Instance
 * @since 0.14.1
 */
export const Category: Category2<URI> = {
  URI,
  compose,
  id,
}

/**
 * @category Type-level
 * @since 0.14.1
 */
export type TypeOf<E> = E extends Encoder<any, infer A> ? A : never

/**
 * @category Type-level
 * @since 0.14.1
 */
export type OutputOf<E> = E extends Encoder<infer O, any> ? O : never
