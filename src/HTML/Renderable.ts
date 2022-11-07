import { Fx, Subject } from '@typed/fx'
import { Effect } from 'node_modules/@effect/core/io/Effect.js'

import { Placeholder } from './Placeholder.js'

export type Renderable =
  | Renderable.Value
  | Effect<any, any, Renderable.Value>
  | Fx<any, any, Renderable.Value>
  | Subject<any, Renderable.Value>
  | readonly Renderable[]

export namespace Renderable {
  export type Value = Placeholder<any> | null | undefined | void | readonly Renderable.Value[]
}
