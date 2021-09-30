import * as Either from 'fp-ts/Either'
import { flow } from 'fp-ts/function'

import { interrupted, isCause, unexpected } from '@/Cause'
import { Exit } from '@/Exit'

import { Scope } from '../Scope'
import { isPromiseLike } from './isPromiseLike'

/**
 * Exit and close the current scope.
 */
export function createMainExit<A>(
  scope: Scope,
  onExit: (exit: Exit<A>) => void,
): (exit: Exit<A>) => void {
  let hasExited = false

  scope.trackResources({ cancel: () => exitOnce(Either.left(interrupted)) })

  function exitOnce(exit: Exit<A>): void {
    if (hasExited) {
      return
    }

    hasExited = true

    const x = scope.cancel()

    if (isPromiseLike(x)) {
      return void x.then(
        () => onExit(exit),
        flow((x) => (isCause(x) ? x : unexpected(x)), Either.left, onExit),
      )
    }

    onExit(exit)
  }

  return exitOnce
}
