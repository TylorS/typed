import type { Tag } from '@effect/data/Context'
import * as Effect from '@effect/io/Effect'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const serviceWithEffect: <T>(
  tag: Tag<T>,
) => <R, E, A>(f: (a: T) => Effect.Effect<R, E, A>) => Fx<T | R, E, A> = (tag) => (f) =>
  fromEffect(Effect.serviceWithEffect(tag, f))
