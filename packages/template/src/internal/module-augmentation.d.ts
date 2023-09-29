import type { Placeholder } from "@typed/template/Placeholder"

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

declare module "@effect/io/Effect" {
  export interface Effect<R, E, A> extends Placeholder<R, E, A> {}
}

declare module "@effect/stream/Stream" {
  export interface Stream<R, E, A> extends Placeholder<R, E, A> {}
}

declare module "@typed/fx/Fx" {
  export interface Fx<R, E, A> extends Placeholder<R, E, A> {}
}
