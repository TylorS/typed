import * as Effect from '@effect/io/Effect'

import { Fx } from '../Fx.js'

import { observe } from './observe.js'

export const drain: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, void> = observe(Effect.unit)
