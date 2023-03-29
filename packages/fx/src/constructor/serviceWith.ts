import type { Tag } from '@effect/data/Context'
import * as Effect from '@effect/io/Effect'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const serviceWith: <I, T>(tag: Tag<I, T>) => <A>(f: (a: T) => A) => Fx<I, never, A> =
  (tag) => (f) =>
    fromEffect(Effect.map(tag, f))
