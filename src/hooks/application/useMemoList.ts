import { deepEqualsEq } from '@typed/fp/common/exports'
import { Effect, Pure } from '@typed/fp/Effect/exports'
import { SchedulerEnv } from '@typed/fp/fibers/exports'
import { Eq } from 'fp-ts/Eq'

import { HookOpEnvs } from '../domain/exports'
import { useMemoListEffect } from './useMemoListEffect'

export const useMemoList = <A, B>(
  fn: (t: A, index: number) => B,
  values: ReadonlyArray<A>,
  eq: Eq<A> = deepEqualsEq,
): Effect<HookOpEnvs & SchedulerEnv, ReadonlyArray<B>> => {
  return useMemoListEffect<A, {}, B>(
    (value, index) => Pure.fromIO(() => fn(value, index)),
    values,
    eq,
  )
}
