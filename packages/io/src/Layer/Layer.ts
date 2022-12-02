import { Context } from '@fp-ts/data/Context'
import { identity } from '@fp-ts/data/Function'

import { Effect } from '../Effect/Effect.js'
import { FiberRef } from '../FiberRef/FiberRef.js'

export interface Layer<R, E, A> extends FiberRef<R, E, Context<A>> {}

export function Layer<R, E, A>(effect: Effect<R, E, Context<A>>): Layer<R, E, A> {
  return FiberRef(effect, { join: identity })
}
