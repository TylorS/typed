import { flow } from '@effect/data/Function'
import type { Option } from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const fromOption: <A>(option: Option<A>) => Fx<never, Option<never>, A> = flow(
  Effect.fromOption,
  fromEffect,
)
