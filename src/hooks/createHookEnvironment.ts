import { Disposable } from '@most/types'
import {
  chain,
  doEffect,
  doEffectWith,
  Effect,
  execPure,
  FiberEnv,
  map,
  provide,
  Pure,
  SchedulerEnv,
} from '@typed/fp/Effect'
import { createUuid, UuidEnv } from '@typed/fp/Uuid'
import { pipe } from 'fp-ts/es6/function'
import { IORef, newIORef } from 'fp-ts/es6/IORef'
import { fromNullable, isSome, Option } from 'fp-ts/es6/Option'
import { constFalse } from 'fp-ts/lib/function'
import { fold } from 'fp-ts/lib/Option'
import { create } from 'most-subject'

import { Channel } from './Channel'
import { HookEnv, HookEnvironment, UseState } from './HookEnvironment'
import { HookEventType, isChannelUpdateEvent, sendHookEvent, useOnHookEvent } from './hookEvents'

/**
 * Create a HookEnvironment
 */
export function createHookEnvironment(): Effect<
  UuidEnv & SchedulerEnv & Partial<HookEnv>,
  HookEnvironment
> {
  return doEffectWith(function* (e: Partial<HookEnv> & SchedulerEnv) {
    const { nextId, resetId } = createIdGenerator()
    const parent = fromNullable(e.hookEnvironment)
    const events = pipe(
      parent,
      fold(create, (e) => e.events),
    )
    const states = new Map<number, unknown>()
    const channelStates = new WeakMap<Channel<any, any>, UseState<any>>()
    const needsUpdate = newIORef(false)()
    const hookEnv: HookEnv = {
      get hookEnvironment() {
        return env
      },
    }
    const emitUpdated = (updated: boolean) =>
      pipe(
        doEffect(function* () {
          needsUpdate.write(updated)()

          yield* sendHookEvent([
            HookEventType.EnvironmentUpdated,
            {
              hookEnvironment: env,
              needsUpdate: updated,
            },
          ])
        }),
        provide(e),
        provide(hookEnv),
      )
    const emitUpdateTrue = emitUpdated(true)
    const emitUpdateFalse = emitUpdated(false)
    const emitChannelUpdate = (channel: Channel<any, any>) =>
      pipe(
        sendHookEvent([HookEventType.ChannelUpdated, { channel, hookEnvironment: env }]),
        provide(hookEnv),
      )

    const env: HookEnvironment = {
      id: yield* createUuid,
      parent,
      events,
      get needsUpdate() {
        return needsUpdate.read()
      },
      runWith,
      useRef: createUseRef(nextId, states),
      useState: createUseState(nextId, states, emitUpdateTrue),
      useChannel: createUseChannel(channelStates, parent, emitChannelUpdate, onChannelUpdate),
    }

    return env

    // Run an effect while managing it's hookEnvironment dependencies + internal state
    function runWith<E, A>(eff: Effect<E & HookEnv, A>): Effect<E, A> {
      const provided = pipe(eff, provide(hookEnv)) as Effect<E, A>

      return doEffect(function* () {
        resetId()
        yield* emitUpdateFalse

        return yield* provided
      })
    }

    function onChannelUpdate(c: Channel<any, any>, isProvider: boolean) {
      return runWith(
        useOnHookEvent(isChannelUpdateEvent, (_, event) => {
          const { channel, hookEnvironment } = event[1]
          const shouldBeUpdated = !parentNeedsUpdating(parent) && c === channel
          const isMatchingEnvironment = isProvider
            ? hookEnvironment === env
            : isParent(hookEnvironment, parent)

          if (shouldBeUpdated && isMatchingEnvironment) {
            execPure(emitUpdateTrue)
          }
        }),
      )
    }
  })
}

function createIdGenerator() {
  let id = 1

  const nextId = () => id++
  const resetId = () => {
    id = 1
  }

  return { nextId, resetId } as const
}

function createUseRef(nextId: () => number, states: Map<number, unknown>) {
  return <E, A>(eff: Effect<E, A>): Effect<E, IORef<A>> =>
    doEffect(function* () {
      const id = nextId()

      if (states.has(id)) {
        return states.get(id)! as IORef<A>
      }

      const value = yield* eff
      const ref = newIORef(value)()

      states.set(id, ref)

      return ref
    })
}

function createUseState(
  nextId: () => number,
  states: Map<number, unknown>,
  emit: Effect<SchedulerEnv, void>,
) {
  return <E, A>(eff: Effect<E, A>): Effect<E & SchedulerEnv, UseState<A>> =>
    doEffectWith(function* (e) {
      const id = nextId()

      if (states.has(id)) {
        return states.get(id)! as UseState<A>
      }

      let value: A = yield* eff

      function updateValue(updated: A) {
        value = updated

        return updated
      }

      const emitUpdate = (value: A) =>
        pipe(
          map(() => value, emit),
          provide(e),
        )

      const getValue = Pure.fromIO(() => value)
      const useState: UseState<A> = [
        getValue,
        (update) => pipe(getValue, chain(update), map(updateValue), chain(emitUpdate)),
      ]

      states.set(id, useState)

      return useState
    })
}

function createUseChannel(
  states: WeakMap<Channel<any, any>, UseState<any>>,
  parent: Option<HookEnvironment>,
  emitChannelUpdate: (channel: Channel<any, any>) => Effect<SchedulerEnv, void>,
  onChannelUpdate: (
    channel: Channel<any, any>,
    isProvider: boolean,
  ) => Effect<FiberEnv, Disposable>,
) {
  return <E1, A, E2>(
    channel: Channel<E1, A>,
    initialState?: Effect<E2, A>,
  ): Effect<E1 & E2 & FiberEnv, UseState<A>> =>
    doEffectWith(function* (e) {
      if (states.has(channel)) {
        return states.get(channel)!
      }

      if (!initialState && isSome(parent)) {
        return yield* parent.value.useChannel(channel)
      }

      let value = yield* initialState ?? channel.defaultValue

      function updateValue(updated: A) {
        value = updated

        return updated
      }

      const getValue = Pure.fromIO(() => value)
      const useState: UseState<A> = [
        getValue,
        (update) =>
          pipe(
            getValue,
            chain(update),
            map(updateValue),
            chain((value: A) =>
              pipe(
                map(() => value, emitChannelUpdate(channel)),
                provide(e),
              ),
            ),
          ),
      ]

      yield* onChannelUpdate(channel, !!initialState)

      states.set(channel, useState)

      return useState
    })
}

function parentNeedsUpdating(parent: Option<HookEnvironment>): boolean {
  return pipe(
    parent,
    fold(constFalse, (e) => e.needsUpdate || parentNeedsUpdating(e.parent)),
  )
}

function isParent(env: HookEnvironment, parent: Option<HookEnvironment>): boolean {
  return pipe(
    parent,
    fold(
      () => false,
      (e) => e === env || isParent(env, e.parent),
    ),
  )
}
