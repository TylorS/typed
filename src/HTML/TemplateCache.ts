export interface TemplateCache {
  readonly content: DocumentFragment
  readonly holes: readonly TemplateHole[]
}

export type TemplateHole = NodeTemplateHole | AttributeTemplateHole | TextTemplateHole

export interface NodeTemplateHole {
  readonly type: 'node'
  readonly path: readonly number[]
}

export interface AttributeTemplateHole {
  readonly type: 'attr'
  readonly path: readonly number[]
  readonly name: string
}

export interface TextTemplateHole {
  readonly type: 'text'
  readonly path: readonly number[]
}
