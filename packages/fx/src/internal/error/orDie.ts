import { identity } from '@effect/data/Function'

import { orDieWith } from './orDieWith.js'

import type { Fx } from '@typed/fx/internal/Fx'

export const orDie = <R, E, A>(fx: Fx<R, E, A>): Fx<R, never, A> => orDieWith(fx, identity)
