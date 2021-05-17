import { fromIO } from '@fp/Env'
import { alwaysEqualsEq } from '@fp/Eq'
import { createRef, WrappedRef } from '@fp/Ref'

export const HookRefs = createRef(
  fromIO(() => new Map<symbol, WrappedRef<any, any, any>>()),
  Symbol('HookRefs'),
  alwaysEqualsEq,
)
