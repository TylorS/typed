import * as E from '@effect/core/io/Effect'
import { Fx, Subject } from '@typed/fx'

import { Placeholder } from './Placeholder.js'

export type Renderable =
  | Renderable.Value
  | E.Effect<any, any, Renderable.Value>
  | Fx<any, any, Renderable.Value>
  | Subject<any, Renderable.Value>
  | readonly Renderable[]

export namespace Renderable {
  export type Value = Placeholder<any> | null | undefined | void | readonly Renderable.Value[]

  export type Effect =
    | Renderable.Value
    | E.Effect<any, any, Renderable.Value>
    | readonly Renderable.Effect[]
}
