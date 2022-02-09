import { Disposable } from '@/Disposable'
import * as D from '@/Effect/Drain'
import { Fx } from '@/Fx'
import { chain, never } from '@/Fx/Effect'
import { forkDaemon } from '@/Fx/forkDaemon'
import { flow } from '@/Prelude/function'

import { Stream } from './Stream'

export const drain: <R, E, A>(
  stream: Stream<R, E, A>,
  trace?: string | undefined,
) => Fx<R, E, Disposable> = D.drain

export const drainDaemon = flow(
  D.drain,
  chain(() => never),
  forkDaemon,
)
