export const findPath = (node: ParentChildNodes, path: ReadonlyArray<number>): Node =>
  path.reduce(({ childNodes }, index) => childNodes[index], node) as Node

export interface ParentChildNodes {
  readonly parentNode: Node | null
  readonly childNodes: ArrayLike<Node>
}
