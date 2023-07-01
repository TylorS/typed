export interface Effect<R, A> extends Effect.Variance<R, A> {}

export namespace Effect {
  export interface Variance<R, A> {
    readonly _R: (_: never) => R
    readonly _A: (_: never) => A
  }

  export type Any = Effect<any, any>

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type Op<T extends Any> = T extends Effect<infer R, infer _> ? R : never

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type Return<T extends Any> = T extends Effect<infer _, infer A> ? A : never
}
