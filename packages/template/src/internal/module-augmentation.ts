import type { Placeholder } from "../Placeholder.js";

declare global {
  export interface String extends Placeholder<string> {}

  export interface Number extends Placeholder<number> {}

  export interface Boolean extends Placeholder<boolean> {}

  export interface Symbol extends Placeholder<symbol> {}

  export interface BigInt extends Placeholder<bigint> {}

  export interface Array<T>
    extends Placeholder<
      Array<Placeholder.Success<T>>,
      Placeholder.Error<T>,
      Placeholder.Context<T>
    > {}

  export interface ReadonlyArray<T>
    extends Placeholder<
      ReadonlyArray<Placeholder.Success<T>>,
      Placeholder.Error<T>,
      Placeholder.Context<T>
    > {}

  // DOM types
  export interface Node extends Placeholder<Node> {}

  export interface DocumentFragment extends Placeholder<DocumentFragment> {}

  export interface Element extends Placeholder<Element> {}

  export interface HTMLElement extends Placeholder<HTMLElement> {}

  export interface SVGElement extends Placeholder<SVGElement> {}
}
