import { Cancelable } from '@/Cancelable'
import { Exit } from '@/Exit'

import { Fx } from './Fx'
import { Scope } from './Scope'

export interface Runtime {
  /**
   * Runs an Fx and tears down the current scope before Exit.
   */
  readonly runMain: <R, A>(
    fx: Fx<R, A>,
    scope: Scope,
    requirements: R,
    onExit: (exit: Exit<A>) => void,
  ) => Cancelable

  /**
   * Runs an Fx in the given scope.
   */
  readonly runFx: <R, A>(
    fx: Fx<R, A>,
    scope: Scope,
    requirements: R,
    onExit: (exit: Exit<A>) => void,
  ) => Cancelable
}
