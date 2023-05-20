import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'

import { Fx } from './Fx.js'

export function scoped<R, E, A>(fx: Fx<R, E, A>): Fx<Exclude<R, Scope.Scope>, E, A> {
  return Fx((sink) => Effect.scoped(fx.run(sink)))
}
