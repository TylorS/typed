import type { Either } from '@effect/data/Either'
import { flow } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const fromEither: <E, A>(either: Either<E, A>) => Fx<never, E, A> = flow(
  Effect.fromEither,
  fromEffect,
)
