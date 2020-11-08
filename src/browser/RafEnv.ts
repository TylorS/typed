import { RafEnv } from '@typed/fp/dom/exports'
import { Provider, provideSome } from '@typed/fp/Effect/exports'

export const rafEnv: RafEnv<number> = {
  requestAnimationFrame: (cb: FrameRequestCallback) => window.requestAnimationFrame(cb),
  cancelAnimationFrame: (n: number) => window.cancelAnimationFrame(n),
}

export const provideRafEnv: Provider<RafEnv> = provideSome(rafEnv)
