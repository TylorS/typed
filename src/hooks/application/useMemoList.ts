import { deepEqualsEq } from '@typed/fp/common'
import { Effect, Pure } from '@typed/fp/Effect'
import { SchedulerEnv } from '@typed/fp/fibers'
import { Eq } from 'fp-ts/es6/Eq'

import { HookOpEnvs } from '../domain'
import { useMemoListEffect } from './useMemoListEffect'

export const useMemoList = <A, B>(
  fn: (t: A, index: number) => B,
  values: ReadonlyArray<A>,
  eq: Eq<A> = deepEqualsEq,
): Effect<HookOpEnvs & SchedulerEnv, ReadonlyArray<B>> => {
  return useMemoListEffect<A, {}, B, {}>(
    (value, index) => Pure.fromIO(() => fn(value, index)),
    values,
    eq,
  )
}
