export const findPath = (node: ParentChildNodes, path: ReadonlyArray<number>): Node =>
  path.reduceRight(({ childNodes }, index) => childNodes[index], node) as Node

export interface ParentChildNodes {
  readonly parentNode: Node | null
  readonly childNodes: ArrayLike<Node>
}
