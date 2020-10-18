import { provideSome } from '@typed/fp/Effect/exports'

export const provideRafEnv = provideSome({
  requestAnimationFrame: (cb: FrameRequestCallback) => window.requestAnimationFrame(cb),
  cancelAnimationFrame: (n: number) => window.cancelAnimationFrame(n),
})
