import type { Effect } from '@effect/io/Effect'
import { flow } from '@fp-ts/core/Function'

import type { Fx } from '../Fx.js'
import { fromEffect } from '../constructor/fromEffect.js'

import { switchMap } from './switchMap.js'

export function switchMapEffect<A, R2, E2, B>(
  f: (a: A) => Effect<R2, E2, B>,
): <R, E>(stream: Fx<R, E, A>) => Fx<R | R2, E | E2, B> {
  return switchMap(flow(f, fromEffect))
}
