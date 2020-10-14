import { provide } from '@typed/fp/Effect/exports'

export const provideRafEnv = provide({
  requestAnimationFrame: (cb: FrameRequestCallback) => window.requestAnimationFrame(cb),
  cancelAnimationFrame: (n: number) => window.cancelAnimationFrame(n),
})
