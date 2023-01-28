import type { Cause } from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import type { Either } from '@fp-ts/core/Either'
import { flow } from '@fp-ts/core/Function'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const fromEitherCause: <E, A>(either: Either<Cause<E>, A>) => Fx<never, E, A> = flow(
  Effect.fromEitherCause,
  fromEffect,
)
