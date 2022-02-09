export interface Magma<A> {
  readonly concat: (second: A) => (first: A) => A
}

export const First: Magma<any> = { concat: (_s) => (f) => f }
export const Second: Magma<any> = { concat: (s) => (_f) => s }

export const concatAll =
  <A>(M: Magma<A>) =>
  (startWith: A) =>
  (as: ReadonlyArray<A>): A =>
    as.reduce((acc, a) => M.concat(a)(acc), startWith)
