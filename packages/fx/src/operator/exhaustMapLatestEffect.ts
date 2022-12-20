import { Effect } from '@effect/io/Effect'
import { flow } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'
import { fromEffect } from '../constructor/fromEffect.js'

import { exhaustMapLatest } from './exhaustMapLatest.js'

export function exhaustMapLatestEffect<A, R2, E2, B>(
  f: (a: A) => Effect<R2, E2, B>,
): <R, E>(stream: Fx<R, E, A>) => Fx<R | R2, E | E2, B> {
  return exhaustMapLatest(flow(f, fromEffect))
}
