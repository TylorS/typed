import { deepEqualsEq } from '@typed/fp/common/exports'
import { Effect, Pure } from '@typed/fp/Effect/Effect'
import { Fn } from '@typed/fp/lambda/exports'
import { SharedRefEnv } from '@typed/fp/SharedRef/exports'
import { Eq } from 'fp-ts/Eq'
import { getEq } from 'fp-ts/ReadonlyArray'

import { HookEnv } from './HookEnvironment'
import { HookPositions } from './HookPositions'
import { HookSymbols } from './HookSymbols'
import { useMemoEffect } from './useMemoEffect'

export const useMemo = <A extends readonly any[], B>(
  f: Fn<A, B>,
  deps: A | Readonly<A>,
  eq: Eq<A> = getEq(deepEqualsEq),
): Effect<HookEnv & SharedRefEnv<HookPositions> & SharedRefEnv<HookSymbols>, B> =>
  useMemoEffect((...args) => Pure.of(f(...args)), deps, eq)
