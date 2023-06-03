import { Placeholder } from './Placeholder.js'
import { RenderEvent } from './RenderEvent.js'
import { Rendered } from './render.js'

export type Renderable<R = never, E = never> =
  | Renderable.Value
  | Rendered
  | RenderEvent
  | ReadonlyArray<Renderable<R, E>>
  | { readonly [key: string]: Renderable<R, E> }
  | Placeholder<R, E, Renderable<R, E>>

export namespace Renderable {
  export type Value = string | number | boolean | null | undefined | void | ReadonlyArray<Value>
}
