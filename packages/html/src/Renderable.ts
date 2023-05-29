import { Placeholder } from './Placeholder.js'
import { Rendered } from './render.js'

export type Renderable<R = never, E = never> =
  | Renderable.Value
  | Rendered
  | ReadonlyArray<Renderable<R, E>>
  | Placeholder<R, E, Renderable<R, E>>

export namespace Renderable {
  export type Value = string | number | boolean | null | undefined | void | ReadonlyArray<Value>
}
