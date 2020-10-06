import { Effect, EnvOf } from '@typed/fp/Effect/Effect'
import { Fn } from '@typed/fp/lambda/exports'

import { useMemo } from '../core/useMemo'

export const useCallback = <Args extends ReadonlyArray<any>, R>(
  f: Fn<Args, R>,
  deps: ReadonlyArray<any> = [],
): Effect<EnvOf<typeof useMemo>, Fn<Args, R>> => useMemo((_) => f, deps)
