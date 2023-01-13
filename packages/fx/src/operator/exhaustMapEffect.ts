import type { Effect } from '@effect/io/Effect'
import { flow } from '@fp-ts/data/Function'

import type { Fx } from '../Fx.js'
import { fromEffect } from '../constructor/fromEffect.js'

import { exhaustMap } from './exhaustMap.js'

export function exhaustMapEffect<A, R2, E2, B>(
  f: (a: A) => Effect<R2, E2, B>,
): <R, E>(stream: Fx<R, E, A>) => Fx<R | R2, E | E2, B> {
  return exhaustMap(flow(f, fromEffect))
}
