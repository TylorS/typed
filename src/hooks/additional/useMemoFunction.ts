import { Effect, EnvOf } from '@typed/fp/Effect/exports'
import { Fn, memoize } from '@typed/fp/lambda/exports'
import { Eq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/lib/function'

import { useMemo } from '../core/useMemo'

export const useMemoFunction = <Args extends ReadonlyArray<any>, A>(
  fn: Fn<Args, A>,
  eq: Eq<Args>,
): Effect<EnvOf<typeof useMemo>, Fn<Args, A>> => useMemo((e) => pipe(fn, memoize(e)), [eq])
