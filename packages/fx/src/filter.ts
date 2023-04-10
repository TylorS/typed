import type { Predicate, Refinement } from '@effect/data/Predicate'
import { not } from '@effect/data/Predicate'

import { Fx, Sink } from './Fx.js'
import { Effect } from './externals.js'

export function filter<R, E, A, B extends A>(
  fx: Fx<R, E, A>,
  refinement: Refinement<A, B>,
): Fx<R, E, B>
export function filter<R, E, A>(fx: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A>
export function filter<R, E, A>(fx: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A> {
  return Fx((sink) =>
    fx.run(Sink((a) => (predicate(a) ? sink.event(a) : Effect.unit()), sink.error)),
  )
}

export function remove<R, E, A, B extends A>(
  fx: Fx<R, E, A>,
  refinement: Refinement<A, B>,
): Fx<R, E, Exclude<A, B>>
export function remove<R, E, A>(fx: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A>
export function remove<R, E, A>(fx: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A> {
  return filter(fx, not(predicate))
}
