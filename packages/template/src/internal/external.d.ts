declare module "udomdiff" {
  const udomdiff: (
    parentNode: Node,
    current: Array<Node>,
    updated: Array<Node>,
    get: (n: Node, x: number) => Node | DocumentFragment | null,
    before: Node
  ) => Array<Node>

  export default udomdiff
}
