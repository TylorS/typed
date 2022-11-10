import * as Eff from '@effect/core/io/Effect'
import { Fx, Subject } from '@typed/fx'

import { Placeholder } from './Placeholder.js'

export type Renderable<R, E> =
  | Renderable.Value<R>
  | Eff.Effect<R, E, Renderable.Value<R>>
  | Fx<R, E, Renderable.Value<R>>
  | Subject<E, Renderable.Value<R>>
  | readonly Renderable<R, E>[]

export namespace Renderable {
  export type Value<R> = Placeholder<R> | null | undefined | void | readonly Renderable.Value<R>[]

  export type Effect<R, E> =
    | Renderable.Value<R>
    | Eff.Effect<R, E, Renderable.Value<R>>
    | readonly Renderable.Effect<R, E>[]
}
