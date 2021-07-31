/**
 * @typed/fp/function is an extension to fp-ts/function
 *
 * @since 0.9.2
 */
import { FunctionN } from 'fp-ts/function'

/**
 * @since 0.9.2
 * @category Type-level
 */
export type ArgsOf<A> = A extends FunctionN<infer R, any> ? R : never

/**
 * @since 0.9.2
 * @category Type-level
 */
export type AnyFn<R = any> = FunctionN<readonly any[], R>

/**
 * @since 0.9.2
 * @category Type-level
 */
export type Arity1<A, B> = FunctionN<[a: A], B>

/**
 * @since 0.9.2
 * @category Type-level
 */
export type Arity2<A, B, C> = FunctionN<[a: A, b: B], C>

/**
 * @since 0.9.2
 * @category Type-level
 */
export type Arity3<A, B, C, D> = FunctionN<[a: A, b: B, c: C], D>

/**
 * @since 0.9.2
 * @category Type-level
 */
export type Arity4<A, B, C, D, E> = FunctionN<[a: A, b: B, c: C, d: D], E>

/**
 * @since 0.9.2
 * @category Type-level
 */
export type Arity5<A, B, C, D, E, F> = FunctionN<[a: A, b: B, c: C, d: D, e: E], F>

export * from 'fp-ts/function'
