import * as Effect from '@effect/io/Effect'
import { Tag } from '@fp-ts/data/Context'
import { flow } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const serviceWith: <T>(tag: Tag<T>) => <A>(f: (a: T) => A) => Fx<T, never, A> = <T>(
  tag: Tag<T>,
) => flow(Effect.serviceWith(tag), fromEffect)
