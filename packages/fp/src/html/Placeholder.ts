export const PLACEHOLDER = Symbol.for('@typed/Placeholder')

export interface Placeholder<R> {
  readonly [PLACEHOLDER]: () => R
}
