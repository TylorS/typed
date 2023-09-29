export interface Placeholder<out R = never, out E = never, out A = unknown> {
  readonly __Placeholder__: {
    readonly _R: (_: never) => R
    readonly _E: (_: never) => E
    readonly _A: (_: never) => A
  }
}

export namespace Placeholder {
  export type Context<T> = [T] extends [never] ? never : T extends Placeholder<infer R, infer _E, infer _A> ? R : never
  export type Error<T> = [T] extends [never] ? never : T extends Placeholder<infer _R, infer E, infer _A> ? E : never
  export type Success<T> = [T] extends [never] ? never : T extends Placeholder<infer _R, infer _E, infer A> ? A : never
}
