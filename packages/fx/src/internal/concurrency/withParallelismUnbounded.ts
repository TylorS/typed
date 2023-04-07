import type { Fx } from '@typed/fx/internal/Fx'
import { Effect } from '@typed/fx/internal/externals'

export function withParallelismUnbounded<R, E, A>(self: Fx<R, E, A>): Fx<R, E, A> {
  return self.transform(Effect.withParallelismUnbounded)
}
