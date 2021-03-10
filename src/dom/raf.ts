import { Disposable } from '@most/types'
import { Env } from '@typed/fp/Env'
import { async } from '@typed/fp/Resume'

export interface RafEnv {
  readonly requestAnimateFrame: (cb: (time: number) => Disposable) => Disposable
}

export const raf: Env<RafEnv, number> = (e: RafEnv) => async((cb) => e.requestAnimateFrame(cb))
