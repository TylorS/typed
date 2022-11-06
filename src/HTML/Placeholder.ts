export interface Placeholder<R = never> {
  readonly _R: (_: never) => R
}

export namespace Placeholder {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  export type ResourcesOf<T> = [T] extends [Placeholder<infer R>] ? R : never
  /* eslint-enable @typescript-eslint/no-unused-vars */
}

declare global {
  export interface String extends Placeholder {}
  export interface Number extends Placeholder {}
  export interface Boolean extends Placeholder {}
  export interface Symbol extends Placeholder {}
  export interface BigInt extends Placeholder {}

  export interface Node extends Placeholder {}
  export interface DocumentFragment extends Placeholder {}
  export interface Element extends Placeholder {}
  export interface HTMLElement extends Placeholder {}
  export interface SVGElement extends Placeholder {}
}
