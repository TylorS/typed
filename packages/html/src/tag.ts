import { Placeholder } from './Placeholder.js'
import { Renderable } from './Renderable.js'

// Really only useful when you're building your own tag functions
// e.g. div<P extends HMLDivProperties, C extends ReadonlyArray<Renderable<any, any>>>(props: P, children: C): Renderable<P, C>

export type AnyPlaceholders = Readonly<Record<string, Placeholder<any, any, any>>>

export type AnyChildren = ReadonlyArray<Renderable<any, any>>

export type TagResources<
  P extends AnyPlaceholders,
  C extends AnyChildren,
> = Placeholder.ResourcesOf<P[keyof P] | C[number]>

export type TagErrors<P extends AnyPlaceholders, C extends AnyChildren> = Placeholder.ErrorsOf<
  P[keyof P] | C[number]
>
