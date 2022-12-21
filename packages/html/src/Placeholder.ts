// TODO: Investigate Error types in placeholders to broadcast in Fx ??

export interface Placeholder<R = never, E = never> {
  readonly __Placeholder__: {
    readonly _R: (_: never) => R
    readonly _E: (_: never) => E
  }
}

export namespace Placeholder {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  export type ResourcesOf<T> = [T] extends [never]
    ? never
    : [T] extends [Placeholder<infer R, infer _E>]
    ? R
    : never

  export type ErrorsOf<T> = [T] extends [never]
    ? never
    : [T] extends [Placeholder<infer _R, infer _E>]
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
  // export interface Function extends Placeholder {} // TODO: Utilize for directives??
  export interface Array<T> extends Placeholder<Placeholder.ResourcesOf<T>> {}

  // DOM types
  export interface Node extends Placeholder {}
  export interface DocumentFragment extends Placeholder {}
  export interface Element extends Placeholder {}
  export interface HTMLElement extends Placeholder {}
  export interface SVGElement extends Placeholder {}
}
