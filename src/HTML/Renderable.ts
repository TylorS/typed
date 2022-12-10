import { Placeholder } from './Placeholder.js'

export type Renderable<R, E> = Renderable.Value<R, E> | readonly Renderable<R, E>[]

export namespace Renderable {
  export type Value<R, E> =
    | Placeholder<R, E>
    | string
    | number
    | boolean
    | null
    | undefined
    | void
    | readonly Renderable.Value<R, E>[]
}
