import * as Effect from '@effect/io/Effect'
import type { Tag } from '@effect/data/Context'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const serviceWith: <T>(tag: Tag<T>) => <A>(f: (a: T) => A) => Fx<T, never, A> =
  (tag) => (f) =>
    fromEffect(Effect.serviceWith(tag, f))
