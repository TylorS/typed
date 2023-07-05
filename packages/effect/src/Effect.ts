export interface Effect<R, E, A> extends Effect.Variance<R, E, A> {}

export namespace Effect {
  export interface Variance<R, E, A> {
    readonly _R: (_: never) => R
    readonly _E: (_: never) => E
    readonly _A: (_: never) => A
  }

  export type Any<O = any> = Effect<any, any, O>

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type Op<T extends Any> = T extends Effect<infer R, infer _, infer __> ? R : never

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type Error<T extends Any> = T extends Effect<infer _, infer E, infer __> ? E : never

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type Return<T extends Any> = T extends Effect<infer _, infer __, infer A> ? A : never
}
