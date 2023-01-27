import * as Effect from '@effect/io/Effect'
import { flow } from '@fp-ts/core/Function'
import type { Tag } from '@fp-ts/data/Context'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const service: <T>(tag: Tag<T>) => Fx<T, never, T> = flow(Effect.service, fromEffect)
