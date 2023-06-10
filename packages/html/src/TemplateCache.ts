export interface TemplateCache {
  readonly content: DocumentFragment
  readonly holes: readonly TemplateHole[]
}

export type TemplateHole =
  | NodeTemplateHole
  | AttrTemplateHole
  | BooleanTemplateHole
  | ClassNameTemplateHole
  | DataTemplateHole
  | EventTemplateHole
  | PropertyTemplateHole
  | RefTemplateHole
  | TextTemplateHole

export interface NodeTemplateHole {
  readonly type: 'node'
  readonly path: readonly number[]
}

export interface AttrTemplateHole {
  readonly type: 'attr'
  readonly path: readonly number[]
  readonly name: string
}

export interface BooleanTemplateHole {
  readonly type: 'boolean'
  readonly path: readonly number[]
  readonly name: string
}

export interface ClassNameTemplateHole {
  readonly type: 'className'
  readonly path: readonly number[]
}

export interface DataTemplateHole {
  readonly type: 'data'
  readonly path: readonly number[]
}

export interface EventTemplateHole {
  readonly type: 'event'
  readonly path: readonly number[]
  readonly name: string
}

export interface PropertyTemplateHole {
  readonly type: 'property'
  readonly path: readonly number[]
  readonly name: string
}

export interface RefTemplateHole {
  readonly type: 'ref'
  readonly path: readonly number[]
}

export interface TextTemplateHole {
  readonly type: 'text'
  readonly path: readonly number[]
}
