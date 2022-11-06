export const createPath = (node: Node): ReadonlyArray<number> => {
  const path: number[] = []
  let { parentNode } = node
  while (parentNode) {
    path.push(Array.prototype.indexOf.call(parentNode.childNodes, node))
    node = parentNode
    ;({ parentNode } = node)
  }
  return path
}

export const findPath = (node: Node, path: ReadonlyArray<number>): Node =>
  path.reduceRight(({ childNodes }, index) => childNodes[index], node)
