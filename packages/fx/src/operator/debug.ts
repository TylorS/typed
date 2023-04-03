import * as Effect from '@effect/io/Effect'

import type { Fx } from '../Fx.js'

import { tap } from './tap.js'

export const debug = <R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> =>
  tap((x: A) => Effect.sync(() => console.log(x)))(fx)
