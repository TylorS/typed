import { IdleCallbackDeadline, IdleCallbackHandle, WhenIdleEnv } from '@typed/fp/dom/exports'
import { Provider, provideSome } from '@typed/fp/Effect/provide'
import { constVoid } from 'fp-ts/function'
import { performance } from 'perf_hooks'

import { rafEnv } from './RafEnv'

const WHEN_IDLE_TIMEOUT = process.env.WHEN_IDLE_TIMEOUT || '100'
const maxMs = parseInt(WHEN_IDLE_TIMEOUT)

/**
 * A setTimeout based implementation of WhenIdleEnv for node and other non-browser environments.
 * Every deadline will have 100 milliseconds available to it by default. Use process.env.WHEN_IDLE_TIMEOUT
 * to configure this timeout yourself.
 */
export const whenIdleEnv: WhenIdleEnv = {
  requestIdleCallback: (cb) =>
    rafEnv.requestAnimationFrame((start) => {
      const end = start + maxMs
      const timeRemaining = () => Math.max(0, end - performance.now())
      const deadline: IdleCallbackDeadline = {
        timeRemaining,
        didTimeout: false,
      }

      return cb(deadline)
    }),

  cancelIdleCallback: rafEnv.cancelAnimationFrame,
}

/**
 * Provide an Effect with a setTimeout-based WhenIdleEnv.
 */
export const provideWhenIdleEnv: Provider<WhenIdleEnv> = provideSome<WhenIdleEnv>(whenIdleEnv)

/**
 * An implementation of WhenIdleEnv that will not schedule any work to be performed.
 */
export const noOpWhenIdleEnv: WhenIdleEnv = {
  requestIdleCallback: () => IdleCallbackHandle.wrap(void 0),
  cancelIdleCallback: constVoid,
}

export const provideNoOpWhenIdleEnv: Provider<WhenIdleEnv> = provideSome<WhenIdleEnv>(
  noOpWhenIdleEnv,
)
