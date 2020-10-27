import { Disposable, Stream } from '@most/types'
import { Effect, EnvOf } from '@typed/fp/Effect/Effect'
import { ask, doEffect, execPure, provideAll } from '@typed/fp/Effect/exports'
import { SchedulerEnv } from '@typed/fp/fibers/exports'
import { useDisposable } from '@typed/fp/hooks/core/hooks/useDisposable'
import { createEventSink } from '@typed/fp/hooks/helpers/createEventSink'
import { pipe } from 'fp-ts/function'

import { addDisposable } from '../sharedRefs/exports'
import { getHookEnv } from '../types/exports'

export const useStream = <A>(
  stream: Stream<A>,
  onValue: (value: A) => Disposable,
): Effect<SchedulerEnv & EnvOf<typeof useDisposable>, Disposable> =>
  doEffect(function* () {
    const { id } = yield* getHookEnv
    const env = yield* ask<SchedulerEnv & EnvOf<typeof addDisposable>>()
    const onEvent = (value: A) => pipe(addDisposable(id, onValue(value)), provideAll(env), execPure)

    return yield* useDisposable((st, sc) => st.run(createEventSink(onEvent), sc), [
      stream,
      env.scheduler,
    ] as const)
  })
