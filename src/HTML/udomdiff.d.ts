declare module 'udomdiff' {
  const udomdiff: (
    parentNode: Node,
    current: readonly Node[],
    updated: readonly Node[],
    get: (n: Node, x: number) => Node | DocumentFragment | null,
    before: Node,
  ) => readonly Node[]

  export default udomdiff
}
