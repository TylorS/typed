import type { Fx } from '../Fx.js'

import { catchAll } from './catchAll.js'

export function orElse<R2, E2, B>(
  second: Fx<R2, E2, B>,
): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A | B> {
  return catchAll(() => second)
}
