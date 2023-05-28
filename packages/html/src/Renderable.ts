import { Placeholder } from './Placeholder.js'
import { Rendered } from './render.js'

export type Renderable<R = never, E = never> =
  | Rendered
  | string
  | number
  | boolean
  | null
  | undefined
  | void
  | ReadonlyArray<Renderable<R, E>>
  | Placeholder<R, E, Renderable<R, E>>
