import { RafEnv } from '@fp/dom/raf'
import { provideSome } from '@fp/Effect/exports'
import { performance } from 'perf_hooks'

let lastTime: number = performance.now()

/**
 * A setTimeout based implementation of raf for Node
 */
export const rafEnv: RafEnv = {
  requestAnimationFrame: (cb) =>
    setTimeout(() => {
      const now = performance.now()

      cb(now)

      lastTime = now
    }, getNextTime()),
  cancelAnimationFrame: clearTimeout,
}

/**
 * Provide an Effect with a setTimeout-based RafEnv
 */
export const provideRafEnv = provideSome<RafEnv>(rafEnv)

function getNextTime() {
  const now = performance.now()
  const diff = now - lastTime

  return diff > 16 ? 0 : diff
}

/**
 * A RafEnv implementation that does not schedule nor cancel any kind of work.
 */
export const noOpRafEnv: RafEnv = {
  requestAnimationFrame: () => void 0,
  cancelAnimationFrame: () => void 0,
}

/**
 * Provide an Effect with a RafEnv that will not schedule any work
 */
export const provideNoOpRafEnv = provideSome<RafEnv>(noOpRafEnv)
