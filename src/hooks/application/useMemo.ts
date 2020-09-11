import { deepEqualsEq } from '@typed/fp/common/exports'
import { Effect, Pure } from '@typed/fp/Effect/exports'
import { Fn } from '@typed/fp/lambda/exports'
import { OpEnv } from '@typed/fp/Op/exports'
import { Eq } from 'fp-ts/es6/Eq'
import { getEq } from 'fp-ts/es6/ReadonlyArray'

import { UseRefOp } from '../domain/exports'
import { useMemoEffect } from './useMemoEffect'

export const useMemo = <A extends readonly any[], B>(
  f: Fn<A, B>,
  deps: A,
  eq: Eq<A> = getEq(deepEqualsEq),
): Effect<OpEnv<UseRefOp>, B> => useMemoEffect((...args) => Pure.of(f(...args)), deps, eq)
