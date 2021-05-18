import * as E from '@fp/Env'
import { CurrentFiber } from '@fp/Fiber'
import { ArgsOf } from '@fp/function'
import { Resume } from '@fp/Resume'

import { useMemo } from './useMemo'

export function useOp<Op extends (...args: readonly any[]) => E.Env<any, any>>(
  op: Op,
): E.Env<
  CurrentFiber & E.GetRequirements<ReturnType<Op>>,
  (...args: ArgsOf<Op>) => Resume<E.GetValue<ReturnType<Op>>>
> {
  return E.asksE((e: E.GetRequirements<ReturnType<Op>>) =>
    useMemo(
      E.fromIO(() => (...args: ArgsOf<Op>) => op(...args)(e)),
      [e],
    ),
  )
}
