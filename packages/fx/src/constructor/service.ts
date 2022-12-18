import * as Effect from '@effect/io/Effect'
import { Tag } from '@fp-ts/data/Context'
import { flow } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const service: <T>(tag: Tag<T>) => Fx<T, never, T> = flow(Effect.service, fromEffect)
