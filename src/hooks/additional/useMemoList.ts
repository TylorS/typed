import { deepEqualsEq } from '@typed/fp/common/exports'
import { Effect, EnvOf, Pure } from '@typed/fp/Effect/exports'
import { Eq } from 'fp-ts/Eq'

import { useMemoListEffect } from './useMemoListEffect'

export const useMemoList = <A, B>(
  fn: (t: A, index: number) => B,
  values: ReadonlyArray<A>,
  eq: Eq<A> = deepEqualsEq,
): Effect<EnvOf<typeof useMemoListEffect>, ReadonlyArray<B>> => {
  return useMemoListEffect<A, {}, B>(
    (value, index) => Pure.fromIO(() => fn(value, index)),
    values,
    eq,
  )
}
