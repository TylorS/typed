export interface ParentChildNodes {
  readonly parentNode: Node | null;
  readonly childNodes: ArrayLike<Node>;
}

export const findPath = (node: ParentChildNodes, path: ReadonlyArray<number>): Node =>
  path.reduce(({ childNodes }, index) => childNodes[index], node) as Node;
