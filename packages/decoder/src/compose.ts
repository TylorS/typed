import * as Either from '@fp-ts/core/Either'
import { pipe } from '@fp-ts/core/Function'

import type { Decoder } from './decoder.js'

export const compose =
  <I2, O>(to: Decoder<I2, O>) =>
  <I>(from: Decoder<I, I2>): Decoder<I, O> => ({
    decode: (i, options) => pipe(from.decode(i, options), Either.flatMap(to.decode)),
  })
