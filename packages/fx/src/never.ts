import { Fx } from '@typed/fx/Fx'
import { Effect } from '@typed/fx/externals'

export function never<E = never, A = never>(): Fx<never, E, A> {
  return Fx<never, E, A>(() => Effect.never())
}
