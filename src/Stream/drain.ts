import { flow } from 'fp-ts/function'

import * as D from '@/Effect/Drain'
import { chain, never } from '@/Fx/Effect'
import { forkDaemon } from '@/Fx/forkDaemon'

export const drain = D.drain

export const drainDaemon = flow(
  D.drain,
  chain(() => never),
  forkDaemon,
)
