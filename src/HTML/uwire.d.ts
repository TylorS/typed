declare module '@webreflection/uwire' {
  export interface Wire {
    readonly _R: (_: never) => never
    readonly ELEMENT_NODE: 1
    readonly nodeType: 111
    readonly firstChild: Node | null
    readonly lastChild: Node | null
    readonly valueOf: () => DocumentFragment
  }

  export const diffable: (node: Node, operation: number) => Node | DocumentFragment | null
  export const persistent: (fragment: DocumentFragment) => Node | DocumentFragment | Wire
}
