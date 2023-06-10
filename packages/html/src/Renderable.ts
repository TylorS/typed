import type { Placeholder } from './Placeholder.js'
import type { TemplateResult } from './TemplateResult.js'
import type { Rendered } from './render.js'

export type Renderable<R = never, E = never> =
  | Renderable.Value
  | Rendered
  | TemplateResult
  | ReadonlyArray<Renderable<R, E>>
  | { readonly [key: string]: Renderable<R, E> }
  | Placeholder<R, E, Renderable<R, E>>

export namespace Renderable {
  export type Value = string | number | boolean | null | undefined | void | ReadonlyArray<Value>
}
