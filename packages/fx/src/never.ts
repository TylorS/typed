import { Fx } from './Fx.js'
import { Effect } from './externals.js'

export function never<E = never, A = never>(): Fx<never, E, A> {
  return Fx<never, E, A>(() => Effect.never())
}
