import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { fail } from '@typed/fx/internal/constructor/fail'
import { catchAll } from '@typed/fx/internal/error/catchAll'

export const catchTags: {
  <
    R,
    E extends { readonly _tag: string },
    A,
    const K extends ReadonlyArray<E['_tag'] & string>,
    R1,
    E1,
    A1,
  >(
    self: Fx<R, E, A>,
    k: K,
    f: (e: Extract<E, { readonly _tag: K[number] }>) => Fx<R1, E1, A1>,
  ): Fx<R | R1, E1 | Exclude<E, { readonly _tag: K[number] }>, A | A1>

  <
    E extends { readonly _tag: string },
    const K extends ReadonlyArray<E['_tag'] & string>,
    R1,
    E1,
    A1,
  >(
    k: K,
    f: (e: Extract<E, { readonly _tag: K[number] }>) => Fx<R1, E1, A1>,
  ): <R, A>(self: Fx<R, E, A>) => Fx<R | R1, E1 | Exclude<E, { readonly _tag: K[number] }>, A | A1>
} = dualWithTrace(
  3,
  (trace) =>
    <
      R,
      E extends { readonly _tag: string },
      A,
      const K extends ReadonlyArray<E['_tag'] & string>,
      R1,
      E1,
      A1,
    >(
      self: Fx<R, E, A>,
      k: K,
      f: (e: Extract<E, { readonly _tag: K[number] }>) => Fx<R1, E1, A1>,
    ): Fx<R | R1, E1 | Exclude<E, { readonly _tag: K[number] }>, A | A1> => {
      const keys = new Set(k)
      const isTaggedError = (error: E): error is Extract<E, { readonly _tag: K[number] }> =>
        isObject(error) && '_tag' in error && keys.has(error._tag)

      return catchAll(
        self,
        (e): Fx<R1, Exclude<E, { readonly _tag: K[number] }> | E1, A1> =>
          isTaggedError(e) ? f(e) : fail(e as Exclude<E, { readonly _tag: K[number] }>),
      ).traced(trace)
    },
)

const isObject = (value: unknown): value is object => typeof value === 'object' && value !== null
