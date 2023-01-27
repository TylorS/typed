import * as Effect from '@effect/io/Effect'
import { flow } from '@fp-ts/core/Function'
import type { Option } from '@fp-ts/core/Option'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const fromOption: <A>(option: Option<A>) => Fx<never, Option<never>, A> = flow(
  Effect.fromOption,
  fromEffect,
)
