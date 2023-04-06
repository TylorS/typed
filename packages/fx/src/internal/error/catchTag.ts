import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { catchTags } from '@typed/fx/internal/error/catchTags'

export const catchTag: {
  <R, E extends { readonly _tag: string }, A, K extends E['_tag'] & string, R1, E1, A1>(
    self: Fx<R, E, A>,
    k: K,
    f: (e: Extract<E, { readonly _tag: K[number] }>) => Fx<R1, E1, A1>,
  ): Fx<R | R1, E1 | Exclude<E, { readonly _tag: K[number] }>, A | A1>

  <E extends { readonly _tag: string }, K extends E['_tag'] & string, R1, E1, A1>(
    k: K,
    f: (e: Extract<E, { readonly _tag: K[number] }>) => Fx<R1, E1, A1>,
  ): <R, A>(self: Fx<R, E, A>) => Fx<R | R1, E1 | Exclude<E, { readonly _tag: K[number] }>, A | A1>
} = dualWithTrace(3, (trace) => (self, k, f) => catchTags(self, [k], f).traced(trace))
