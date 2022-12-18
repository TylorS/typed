import * as Effect from '@effect/io/Effect'
import { Either } from '@fp-ts/data/Either'
import { flow } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const fromEither: <E, A>(either: Either<E, A>) => Fx<never, E, A> = flow(
  Effect.fromEither,
  fromEffect,
)
