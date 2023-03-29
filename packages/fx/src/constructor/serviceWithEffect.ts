import type { Tag } from '@effect/data/Context'
import * as Effect from '@effect/io/Effect'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const serviceWithEffect: <I, T>(
  tag: Tag<I, T>,
) => <R, E, A>(f: (a: T) => Effect.Effect<R, E, A>) => Fx<I | R, E, A> = (tag) => (f) =>
  fromEffect(Effect.flatMap(tag, f))
