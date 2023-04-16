declare module 'udomdiff' {
  const udomdiff: (
    parentNode: Node,
    current: Node[],
    updated: Node[],
    get: (n: Node, x: number) => Node | DocumentFragment | null,
    before: Node,
  ) => Node[]

  export default udomdiff
}
