import * as Either from '@effect/data/Either'
import { pipe } from '@effect/data/Function'
import * as Cause from '@effect/io/Cause'

import type { Fx } from '../Fx.js'
import { fail } from '../constructor/fail.js'
import { failCause } from '../constructor/failCause.js'

import { catchAllCause } from './catchAllCause.js'

/**
 * @internal
 */
export const catchTag_: <
  K extends E['_tag'] & string,
  E extends { readonly _tag: string },
  R1,
  E1,
  A1,
>(
  cause: Cause.Cause<E>,
  k: K,
  f: (e: Extract<E, { readonly _tag: K }>) => Fx<R1, E1, A1>,
) => Fx<R1, E1 | Exclude<E, { readonly _tag: K }>, A1> = <
  K extends E['_tag'] & string,
  E extends { readonly _tag: string },
  R1,
  E1,
  A1,
>(
  cause: Cause.Cause<E>,
  k: K,
  f: (e: Extract<E, { readonly _tag: K }>) => Fx<R1, E1, A1>,
) =>
  pipe(
    cause,
    Cause.failureOrCause,
    Either.match(
      (e): Fx<R1, E1 | Exclude<E, { readonly _tag: K }>, A1> =>
        '_tag' in e && e._tag === k
          ? f(e as Extract<E, { readonly _tag: K }>)
          : fail(e as Exclude<E, { readonly _tag: K }>),
      failCause,
    ),
  )

export const catchTag =
  <K extends E['_tag'] & string, E extends { readonly _tag: string }, R1, E1, A1>(
    k: K,
    f: (e: Extract<E, { readonly _tag: K }>) => Fx<R1, E1, A1>,
  ) =>
  <R, A>(self: Fx<R, E, A>): Fx<R1 | R, E1 | Exclude<E, { readonly _tag: K }>, A1 | A> =>
    pipe(
      self,
      catchAllCause((cause) => catchTag_(cause, k, f)),
    )
