import * as E from '@fp/Env'
import { flow } from 'fp-ts/function'

import { useMemo } from './useMemo'

export function useOp<Op extends (...args: readonly any[]) => E.Env<unknown, any>>(op: Op) {
  return E.asksE((e: E.GetRequirements<Op>) =>
    useMemo(
      E.fromIO(() => flow(op, E.provideAll(e))),
      [e],
    ),
  )
}
