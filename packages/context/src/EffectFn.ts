import type * as Effect from "@effect/io/Effect"

export interface EffectFn<Args extends ReadonlyArray<any> = ReadonlyArray<any>, R = any, E = any, A = any> {
  (...args: Args): Effect.Effect<R, E, A>
}

export namespace EffectFn {
  export type Extendable<T extends EffectFn> = T extends (
    ...args: infer Args
  ) => Effect.Effect<infer R, infer E, infer A> ? (...args: Args) => Effect.Effect<[R] extends [never] ? any : R, E, A>
    : never

  export type ArgsOf<T extends EffectFn> = T extends (
    ...args: infer Args
  ) => // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Effect.Effect<infer _R, infer _E, infer _A> ? Args
    : never

  export type ResourcesOf<T extends EffectFn> = T extends (
    ...args: infer _Args
  ) => // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Effect.Effect<infer R, infer _E, infer _A> ? R
    : never

  export type ErrorsOf<T extends EffectFn> = T extends (
    ...args: infer _Args
  ) => // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Effect.Effect<infer _R, infer E, infer _A> ? E
    : never

  export type OutputOf<T extends EffectFn> = T extends (
    ...args: infer _Args
  ) => // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Effect.Effect<infer _R, infer _E, infer A> ? A
    : never
}
