import type * as Brand from '@effect/data/Brand'
import * as Either from '@effect/data/Either'
import { pipe } from '@effect/data/Function'
import * as ParseResult from '@fp-ts/schema/ParseResult'

import type { Decoder } from './decoder.js'

/* eslint-disable @typescript-eslint/no-unused-vars */
export const brand =
  <T extends Brand.Brand<any>>(brand: Brand.Brand.Constructor<T>) =>
  <I>(decoder: Decoder<I, Brand.Brand.Unbranded<T>>): Decoder<I, T> =>
  (i, options) =>
    pipe(
      decoder(i, options),
      Either.flatMap((u) =>
        pipe(
          brand.either(u),
          Either.mapLeft(() => [ParseResult.unexpected(u)] as const),
        ),
      ),
    )
/* eslint-enable @typescript-eslint/no-unused-vars */
