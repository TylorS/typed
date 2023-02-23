import type { Tag } from '@effect/data/Context'
import { flow } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const service: <T>(tag: Tag<T>) => Fx<T, never, T> = flow(Effect.service, fromEffect)
