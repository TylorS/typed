import { fromIO } from '@fp/Env'

import { useMemo } from './useMemo'

export const useDefaultValue = <A>(value: A | null | undefined, fallback: () => A) =>
  useMemo(
    fromIO(() => value ?? fallback()),
    [value],
  )
