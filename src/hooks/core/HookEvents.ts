import { filter } from '@most/core'
import { Disposable, lazy } from '@typed/fp/Disposable/exports'
import { ask, doEffect, Effect, EnvOf } from '@typed/fp/Effect/exports'
import { SchedulerEnv } from '@typed/fp/fibers/exports'
import {
  createSharedRef,
  readSharedRef,
  SharedRef,
  SharedRefEnv,
} from '@typed/fp/SharedRef/exports'
import { pipe } from 'fp-ts/lib/function'
import { Subject } from 'most-subject'

import { createEventSink } from '../helpers/createEventSink'
import { HookEvent } from './events'
import { useDisposable } from './useDisposable'

export const HOOK_EVENTS = '@typed/fp/HookEvents'
export type HOOK_EVENTS = typeof HOOK_EVENTS

export interface HookEvents extends SharedRef<HOOK_EVENTS, Subject<HookEvent, HookEvent>> {}

export const HookEvents = createSharedRef<HookEvents>(HOOK_EVENTS)

export const getHookEvents = readSharedRef(HookEvents)

export const sendHookEvent = (
  event: HookEvent,
): Effect<SchedulerEnv & SharedRefEnv<HookEvents>, void> => {
  const eff = doEffect(function* () {
    const { scheduler } = yield* ask<SchedulerEnv>()
    const [sink] = yield* getHookEvents

    sink.event(scheduler.currentTime(), event)
  })

  return eff
}

export const listenToHookEvents = <A extends HookEvent>(
  refinement: (event: HookEvent) => event is A,
  onValue: (value: A) => Disposable,
): Effect<EnvOf<typeof useDisposable> & SchedulerEnv & SharedRefEnv<HookEvents>, Disposable> => {
  const eff = doEffect(function* () {
    const { scheduler } = yield* ask<SchedulerEnv>()
    const [, stream] = yield* getHookEvents

    return yield* useDisposable(
      (s) => {
        const disposable = lazy()

        disposable.addDisposable(
          pipe(s, filter(refinement)).run(
            createEventSink((a) => disposable.addDisposable(onValue(a))),
            scheduler,
          ),
        )

        return disposable
      },
      [stream],
    )
  })

  return eff
}
