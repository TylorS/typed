import { fromIO } from '@fp/Env'
import { alwaysEqualsEq } from '@fp/Eq'
import { Fiber } from '@fp/Fiber'
import { RefId } from '@fp/Ref'
import { createRefMap } from '@fp/RefMap'

export const HookProviders = createRefMap(
  fromIO(() => new Map<RefId, Fiber<unknown>>()),
  Symbol('HookProviders'),
  alwaysEqualsEq,
)
