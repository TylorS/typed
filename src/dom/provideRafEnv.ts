import { Provider, provideSome } from '@typed/fp/Effect/exports'

import { RafEnv } from './raf'

export const provideRafEnv: Provider<RafEnv> = provideSome({
  requestAnimationFrame: (cb: FrameRequestCallback) => window.requestAnimationFrame(cb),
  cancelAnimationFrame: (n: number) => window.cancelAnimationFrame(n),
})
