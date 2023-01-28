import { identity } from '@fp-ts/core/Function'

import type { Fx } from '../Fx.js'

import { zipItems } from './zipItems.js'

export function withItems<B>(items: Iterable<B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, B> {
  return zipItems(items, identity)
}
