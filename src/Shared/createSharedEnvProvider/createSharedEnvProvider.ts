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
import { SchedulerEnv } from '@typed/fp/scheduler/exports'
import { constVoid, pipe } from 'fp-ts/function'
import { isNonEmpty } from 'fp-ts/ReadonlyArray'
import { ReadonlyNonEmptyArray } from 'fp-ts/ReadonlyNonEmptyArray'

import { getSharedEvents, SharedEvent } from '../core/events/exports'
import { addDisposable } from '../core/exports'
import { Namespace } from '../core/model/exports'
import { SharedEnv } from '../core/services/SharedEnv'
import { GlobalNamespace } from '../global/Global'
import { createSharedEnv } from './createSharedEnv'
import { SharedEventHandler } from './SharedEventHandler'

export type SharedEnvOptions = {
  // Configure event listeners for SharedEvents
  readonly handlers: ReadonlyArray<SharedEventHandler<any>>
  // Configure the namespace used as the root.
  readonly namespace?: Namespace
}

/**
 * Create a SharedEnv Provider that will listen to SharedEvents to provide additional
 * functionality.
 */
export function createSharedEnvProvider(
  options: SharedEnvOptions,
): Provider<SharedEnv, SchedulerEnv> {
  const { namespace = GlobalNamespace, handlers } = options
  const sharedEnv = createSharedEnv(namespace)

  return isNonEmpty(handlers) ? useWith(listenToEvents(handlers, sharedEnv)) : useSome(sharedEnv)
}

const listenToEvents = (
  handlers: ReadonlyNonEmptyArray<SharedEventHandler<any>>,
  env: SharedEnv,
): Effect<SchedulerEnv, SharedEnv> => {
  const eff = doEffect(function* () {
    const { scheduler } = yield* ask<SchedulerEnv>()
    const stream = yield* pipe(getSharedEvents, useAll(env))

    const respondToEvents = (event: SharedEvent) => {
      for (const [guard, handler] of handlers) {
        if (guard.is(event)) {
          pipe(event, handler, useAll(env), execPure)
        }
      }
    }

    yield* pipe(addDisposable(stream.run(createEmptySink(respondToEvents), scheduler)), useAll(env))

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
