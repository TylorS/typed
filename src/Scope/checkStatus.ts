import { isNone } from 'fp-ts/Option'

import { Scope } from './Scope'

export interface ScopeStatus {
  readonly open: boolean
  readonly closed: boolean
  readonly finalized: boolean
  readonly finalizing: boolean
  readonly interruptible: boolean
  readonly uninterruptible: boolean
}

const gloablStatus = {
  open: true,
  closed: false,
  finalized: false,
  finalizing: false,
  interruptible: false,
  uninterruptible: true,
}

export function checkStatus<R, A>(scope: Scope<R, A>): ScopeStatus {
  if (scope.type === 'Global') {
    return gloablStatus
  }

  const exit = scope.exit.get()
  const open = isNone(exit)

  return {
    open,
    closed: !open,
    finalizing: scope.finalizing.get(),
    finalized: scope.finalized.get(),
    interruptible: scope.uninterruptibleRegions.get() === 0,
    uninterruptible: scope.uninterruptibleRegions.get() > 0,
  }
}
