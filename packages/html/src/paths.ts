export const findPath = (node: ParentChildNodes, path: ReadonlyArray<number>): Node => {
  console.log(node.childNodes, path)
  const r = path.reduce(({ childNodes }, index) => childNodes[index], node) as Node
  console.log(r)
  return r
}

export interface ParentChildNodes {
  readonly parentNode: Node | null
  readonly childNodes: ArrayLike<Node>
}
