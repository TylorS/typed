import * as Effect from '@effect/io/Effect'
import type { Tag } from '@fp-ts/data/Context'
import { flow } from '@fp-ts/data/Function'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const serviceWithEffect: <T>(
  tag: Tag<T>,
) => <R, E, A>(f: (a: T) => Effect.Effect<R, E, A>) => Fx<T | R, E, A> = <T>(tag: Tag<T>) =>
  flow(Effect.serviceWithEffect(tag), fromEffect)
