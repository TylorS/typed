import { performance } from 'perf_hooks'

import { IdleCallbackDeadline, WhenIdleEnv } from '../dom/exports'
import { provideSome } from '../Effect/provide'
import { rafEnv } from './RafEnv'

const maxMs = 100

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

export const provideWhenIdleEnv = provideSome<WhenIdleEnv>(whenIdleEnv)
