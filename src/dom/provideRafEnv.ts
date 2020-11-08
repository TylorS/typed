import { Provider, provideSome } from '@typed/fp/Effect/exports'

import { RafEnv } from './raf'

export const rafEnv: RafEnv = {
  requestAnimationFrame: (cb: FrameRequestCallback) => window.requestAnimationFrame(cb),
  cancelAnimationFrame: (n: number) => window.cancelAnimationFrame(n),
}

export const provideRafEnv: Provider<RafEnv> = provideSome(rafEnv)
