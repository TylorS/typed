export interface Tree<A> {
  readonly value: A
  readonly forest: Forest<A>
}

export type Forest<A> = readonly Tree<A>[]
