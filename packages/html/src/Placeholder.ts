// TODO: Investigate Error types in placeholders to broadcast in Fx ??

import type { Effect } from '@effect/io/Effect'
import type { Fx } from '@typed/fx'

export interface Placeholder<R = never, E = never> {
  readonly __Placeholder__: {
    readonly _R: (_: never) => R
    readonly _E: (_: never) => E
  }
}

export namespace Placeholder {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  export type ResourcesOf<T> = [T] extends [null]
    ? never
    : [T] extends [undefined]
    ? never
    : [T] extends [never]
    ? never
    : [T] extends [Placeholder<infer R, infer _E>]
    ? R
    : [T] extends [Fx<infer R, infer _E, infer _A>]
    ? R
    : [T] extends [Effect<infer R, infer _E, infer _A>]
    ? R
    : never

  export type ErrorsOf<T> = [T] extends [null]
    ? never
    : [T] extends [undefined]
    ? never
    : [T] extends [never]
    ? never
    : [T] extends [Placeholder<infer _R, infer _E>]
    ? _E
    : [T] extends [Fx<infer _R, infer _E, infer _A>]
    ? _E
    : [T] extends [Effect<infer _R, infer _E, infer _A>]
    ? _E
    : never
  /* eslint-enable @typescript-eslint/no-unused-vars */
}

declare global {
  // Builtins
  export interface String extends Placeholder {}
  export interface Number extends Placeholder {}
  export interface Boolean extends Placeholder {}
  export interface Symbol extends Placeholder {}
  export interface BigInt extends Placeholder {}
  export interface Array<T>
    extends Placeholder<Placeholder.ResourcesOf<T>, Placeholder.ErrorsOf<T>> {}
  // export interface Function extends Placeholder {} // TODO: Utilize for directives??

  // DOM types
  export interface Node extends Placeholder {}
  export interface DocumentFragment extends Placeholder {}
  export interface Element extends Placeholder {}
  export interface HTMLElement extends Placeholder {}
  export interface SVGElement extends Placeholder {}
}

declare module '@typed/fx' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface Fx<R, E, A> extends Placeholder<R, E> {}
}
