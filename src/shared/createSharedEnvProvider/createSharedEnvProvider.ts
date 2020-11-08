import { filter } from '@most/core'
import { disposeAll } from '@most/disposable'
import { Sink } from '@most/types'
import {
  ask,
  doEffect,
  Effect,
  execPure,
  Provider,
  useAll,
  useSome,
  useWith,
} from '@typed/fp/Effect/exports'
import { SchedulerEnv } from '@typed/fp/fibers/exports'
import { constVoid, flow, pipe } from 'fp-ts/function'
import { Guard } from 'io-ts/Guard'

import { getSharedEvents, SharedEvent } from '../core/events/exports'
import { addDisposable } from '../core/exports'
import { Namespace } from '../core/model/exports'
import { SharedEnv } from '../core/services/SharedEnv'
import { GlobalNamespace } from '../global/exports'
import { createSharedEnv } from './createSharedEnv'
import { defaultHandlers } from './defaultHandlers'
import { SharedEventHandler } from './SharedEventHandler'

export type SharedEnvOptions = {
  readonly namespace: Namespace
  // Optionally configure event listeners for SharedEvents
  readonly handlers?: ReadonlyArray<SharedEventHandler<any>>
}

/**
 * Create a SharedEnv Provider that will listen to SharedEvents to provide additional
 * functionality.
 */
export function createSharedEnvProvider(
  options: SharedEnvOptions = { namespace: GlobalNamespace },
): Provider<SharedEnv, SchedulerEnv> {
  const { namespace, handlers = defaultHandlers } = options
  const sharedEnv = createSharedEnv(namespace)

  if (handlers.length > 0) {
    return useWith(listenToEvents(handlers, sharedEnv))
  }

  return (eff) => pipe(eff, useSome(sharedEnv))
}

const listenToEvents = (
  handlers: ReadonlyArray<SharedEventHandler<any>>,
  env: SharedEnv,
): Effect<SchedulerEnv, SharedEnv> => {
  const eff = doEffect(function* () {
    const { scheduler } = yield* ask<SchedulerEnv>()
    const stream = yield* pipe(getSharedEvents, useAll(env))
    const listen = <A extends SharedEvent>(
      guard: Guard<unknown, A>,
      respond: (value: A) => Effect<SharedEnv, void>,
    ) =>
      filter(guard.is, stream).run(createEmptySink(flow(respond, useAll(env), execPure)), scheduler)

    yield* pipe(
      addDisposable(disposeAll(handlers.map(([guard, handler]) => listen(guard, handler)))),
      useAll(env),
    )

    return env
  })

  return eff
}

function createEmptySink<A>(onValue: (value: A) => void): Sink<A> {
  return {
    event: (_, a) => onValue(a),
    error: constVoid,
    end: constVoid,
  }
}
