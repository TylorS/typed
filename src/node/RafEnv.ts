import { RafEnv } from '@typed/fp/dom/raf'
import { provideSome } from '@typed/fp/Effect/exports'
import { performance } from 'perf_hooks'

let lastTime: number = performance.now()

export const rafEnv: RafEnv = {
  requestAnimationFrame: (cb) =>
    setTimeout(() => {
      const now = performance.now()

      cb(now)

      lastTime = now
    }, getNextTime()),
  cancelAnimationFrame: clearTimeout,
}

export const provideRafEnv = provideSome<RafEnv>(rafEnv)

function getNextTime() {
  const now = performance.now()
  const diff = now - lastTime

  return diff > 16 ? 0 : diff
}
