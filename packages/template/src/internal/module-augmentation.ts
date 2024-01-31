import type { Placeholder } from "../Placeholder.js"

declare global {
  export interface String extends Placeholder<never, never, string> {}

  export interface Number extends Placeholder<never, never, number> {}

  export interface Boolean extends Placeholder<never, never, boolean> {}

  export interface Symbol extends Placeholder<never, never, symbol> {}

  export interface BigInt extends Placeholder<never, never, bigint> {}

  export interface Array<T> extends
    Placeholder<
      Placeholder.Context<T>,
      Placeholder.Error<T>,
      Array<Placeholder.Success<T>>
    >
  {}

  export interface ReadonlyArray<T> extends
    Placeholder<
      Placeholder.Context<T>,
      Placeholder.Error<T>,
      ReadonlyArray<Placeholder.Success<T>>
    >
  {}

  // DOM types
  export interface Node extends Placeholder<never, never, Node> {}

  export interface DocumentFragment extends Placeholder<never, never, DocumentFragment> {}

  export interface Element extends Placeholder<never, never, Element> {}

  export interface HTMLElement extends Placeholder<never, never, HTMLElement> {}

  export interface SVGElement extends Placeholder<never, never, SVGElement> {}
}

declare module "@typed/fx/Fx" {
  export interface Fx<R, E, A> extends Placeholder<R, E, A> {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface FxEffectBase<R, E, A, R2, E2, B> extends Placeholder<R, E, A> {}
}
