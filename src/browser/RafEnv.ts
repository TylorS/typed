import { RafEnv } from '@typed/fp/dom/exports'
import { Provider, provideSome } from '@typed/fp/Effect/exports'

/**
 * Browser implementation of RafEnv with a return handle of `number` matching that of the
 * native requestAnimationFrame and cancelAnimationFrame.
 */
export const rafEnv: RafEnv<number> = {
  requestAnimationFrame: (cb: FrameRequestCallback) => window.requestAnimationFrame(cb),
  cancelAnimationFrame: (n: number) => window.cancelAnimationFrame(n),
}

/**
 * Provide a RafEnv to an Effect using the native browser implementation of requestAnimationFrame.
 */
export const provideRafEnv: Provider<RafEnv> = provideSome(rafEnv)
