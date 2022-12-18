import * as Effect from '@effect/io/Effect'
import { flow } from '@fp-ts/data/Function'
import { Option } from '@fp-ts/data/Option'

import { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const fromOption: <A>(option: Option<A>) => Fx<never, Option<never>, A> = flow(
  Effect.fromOption,
  fromEffect,
)
