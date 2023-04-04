import { Effect, withRuntimeFlags } from '@effect/io/Effect'
import { CooperativeYielding } from '@effect/io/Fiber/Runtime/Flags'
import { disable } from '@effect/io/Fiber/Runtime/Flags/Patch'

export function disableCooperativeYielding<R, E, A>(effect: Effect<R, E, A>): Effect<R, E, A> {
  return withRuntimeFlags(effect, disable(CooperativeYielding))
}
