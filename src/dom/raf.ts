import { Env } from '@fp/Env'
import { Resume } from '@fp/Resume'
import { Time } from '@most/types'

export interface Raf {
  readonly raf: Resume<Time>
}

export const raf: Env<Raf, number> = (e: Raf) => e.raf
