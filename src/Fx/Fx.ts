export interface Fx<R, E, A> {
  readonly _R: (r: R) => void
  readonly _E: () => E
  readonly _A: () => A
}

export const URI = 'Fx'
export type URI = typeof URI

declare module '@/Hkt' {
  export interface UriToKind3<A, B, C> {
    [URI]: Fx<A, B, C>
  }
}
