import { Fx } from './Fx.js'
import { Effect, Scope } from './externals.js'

export function scoped<R, E, A>(fx: Fx<R, E, A>): Fx<Exclude<R, Scope.Scope>, E, A> {
  return Fx((sink) => Effect.scoped(fx.run(sink)))
}
