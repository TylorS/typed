import { doEffect, use } from '@typed/fp/Effect/exports'
import { pause } from '@typed/fp/fibers/exports'
import { pipe } from 'fp-ts/function'
import { isNone } from 'fp-ts/Option'

import { effectQueue } from '../sharedRefs/EffectQueue'

export const effectsWorker = doEffect(function* () {
  const option = yield* effectQueue.dequeue

  if (isNone(option)) {
    return
  }

  const [eff, env] = option.value

  yield* pipe(eff, use(env))

  yield* pause
})
