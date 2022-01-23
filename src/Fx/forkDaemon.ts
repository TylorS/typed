import { fork } from '@/Effect/Fork'
import { Fiber, RuntimeOptions } from '@/Fiber'
import { globalScope } from '@/Scope'

import { Fx } from './Fx'

/**
 * Fork a fiber from the global scope
 */
export const forkDaemon = <R, E, A>(
  fx: Fx<R, E, A>,
  options?: Omit<RuntimeOptions, 'scope'>,
): Fx<R, never, Fiber<E, A>> => fork(fx, { ...options, scope: globalScope })
