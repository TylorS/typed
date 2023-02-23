import * as Either from '@effect/data/Either'
import { pipe } from '@effect/data/Function'

import type { Decoder } from './decoder.js'

export const compose =
  <I2, O>(to: Decoder<I2, O>) =>
  <I>(from: Decoder<I, I2>): Decoder<I, O> =>
  (i, options) =>
    pipe(from(i, options), Either.flatMap(to))
