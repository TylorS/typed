import { Fn } from '@typed/fp/lambda/exports'

import { useMemo } from './useMemo'

export const useCallback = <F extends Fn>(f: F, deps: ReadonlyArray<unknown>) =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  useMemo((_) => f, deps)
