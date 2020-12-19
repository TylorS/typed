/**
 * A generator-based do-notation for effects.
 */
export interface Fx<E extends readonly any[] = readonly any[], A = unknown> {
  readonly [Symbol.iterator]: () => Iterator<E[number], A, unknown>
}

/**
 * An Fx which has all of it's effects satisfied.
 */
export interface PureFx<A = unknown> extends Fx<readonly [], A> {}

/**
 * Extract all of the effects contained within an Fx
 */
export type EffectsOf<A> = A extends Fx<infer R, any> ? R : never

/**
 * Extract the result value from an Fx
 */
export type ResultOf<A> = A extends Fx<any, infer R> ? R : never
