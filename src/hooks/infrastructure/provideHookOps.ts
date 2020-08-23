import { filter } from '@most/core'
import { Arity1 } from '@typed/fp/common'
import { ask, doEffect, Effect, provide, Pure } from '@typed/fp/Effect'
import { SchedulerEnv } from '@typed/fp/fibers'
import { provideOpGroup } from '@typed/fp/Op/provideOpGroup'
import { createUuid, Uuid } from '@typed/fp/Uuid'
import { Eq } from 'fp-ts/es6/Eq'
import { eqStrict } from 'fp-ts/lib/Eq'
import { constVoid, pipe } from 'fp-ts/lib/function'
import { lookup } from 'fp-ts/lib/Map'
import { fold, isNone, isSome, none, Option, some } from 'fp-ts/lib/Option'

import {
  Channel,
  ChannelName,
  createHookEnvironment,
  createRef,
  HookEnv,
  HookEnvironment,
  HookEvent,
  HookEventType,
  HookOps,
  Ref,
  RemovedHookEnvironment,
  UseState,
} from '../domain'
import { INITIAL_ENV_INDEX } from './constants'
import { HooksManagerEnv } from './HooksManagerEnv'

const lookupByIndex = lookup(eqStrict)

/**
 * Provides a default implementation of all of the base hook operations around a `HookEnv`
 */
export const provideHookOps = provideOpGroup(
  HookOps,
  doEffect(function* () {
    const rootEnv = yield* ask<HooksManagerEnv & SchedulerEnv>()
    const { hookPositions, channelConsumers, channelProviders, hookEvents, scheduler } = rootEnv
    const [sink, stream] = hookEvents
    const sendEvent = (event: HookEvent) => sink.event(scheduler.currentTime(), event)

    rootEnv.hookEnvironment.addDisposable(
      pipe(
        stream,
        filter((e): e is RemovedHookEnvironment => e.type === HookEventType.RemovedEnvironment),
      ).run(
        {
          event(_, { hookEnvironment }) {
            const { id, channelStates, parent, states } = hookEnvironment

            channelStates.forEach((_, name) => {
              channelConsumers.get(name)?.delete(hookEnvironment)
              channelProviders.get(name)?.delete(hookEnvironment)
            })

            hookPositions.delete(id)
            states.clear()
            channelStates.clear()

            pipe(
              parent,
              fold(
                () => void 0,
                ({ children }) => children.delete(id),
              ),
            )

            hookEnvironment.dispose()
          },
          error: constVoid,
          end: constVoid,
        },
        scheduler,
      ),
    )

    const useRefByIndex = <E, A>(initialValue: Effect<E, A>): Effect<HookEnv & E, Ref<A>> =>
      doEffect(function* () {
        const { hookEnvironment } = yield* ask<HookEnv>()
        const index = getNextIndex(hookPositions, hookEnvironment.id)
        const state = getStateByIndex(hookEnvironment, index)

        if (isNone(state)) {
          return yield* setRefByIndex(hookEnvironment, index, initialValue)
        }

        return state.value as Ref<A>
      })

    const useStateByIndex = <E, A>(
      initialValue: Effect<E, A>,
      eq: Eq<A> = eqStrict,
    ): Effect<HookEnv & E, UseState<A>> =>
      doEffect(function* () {
        const { hookEnvironment } = yield* ask<HookEnv>()
        const index = getNextIndex(hookPositions, hookEnvironment.id)
        const state = getStateByIndex(hookEnvironment, index)

        if (isNone(state)) {
          return yield* createUseState({
            states: hookEnvironment.states,
            initialValue,
            key: index,
            eq,
            sendEvent,
            createEvent: () => ({
              type: HookEventType.UpdatedEnvironment,
              hookEnvironment,
              updated: true,
            }),
          })
        }

        return state.value
      })

    const useChannelOp = <E, A>(channel: Channel<E, A>): Effect<E & HookEnv, A> =>
      doEffect(function* () {
        const env = yield* ask<HookEnv>()
        const { hookEnvironment } = env
        const { name } = channel

        appendTo(channelConsumers, name, hookEnvironment)

        const provider = findProvider(hookEnvironment, name)

        if (isSome(provider)) {
          return provider.value.channelStates.get(name)!
        }

        return yield* pipe(
          provideChannelOp(channel, channel.defaultValue),
          provide({ hookEnvironment: rootEnv.hookEnvironment }),
        ) as Effect<E, any>
      })

    const provideChannelOp = <E1, A, E2>(
      channel: Channel<E1, A>,
      initialValue: Effect<E2, A>,
      eq: Eq<A> = eqStrict,
    ) =>
      doEffect(function* () {
        const { hookEnvironment } = yield* ask<HookEnv>()
        const { channelStates } = hookEnvironment
        const { name } = channel

        appendTo(channelProviders, name, hookEnvironment)

        if (channelStates.has(name)) {
          return channelStates.get(name)!
        }

        return yield* createUseState({
          states: channelStates,
          initialValue,
          key: name,
          eq,
          sendEvent,
          createEvent: <A>(value: A) => ({
            type: HookEventType.UpdatedChannel,
            channel: name,
            hookEnvironment,
            value,
          }),
        })
      })

    const runWithHooks = <E, A>(
      eff: Effect<E & HookEnv, A>,
      hookEnvironment: HookEnvironment,
    ): Effect<E, A> =>
      doEffect(function* () {
        hookEvents[0].event(scheduler.currentTime(), {
          type: HookEventType.UpdatedEnvironment,
          hookEnvironment,
          updated: false,
        })
        hookPositions.set(hookEnvironment.id, INITIAL_ENV_INDEX)

        const value = yield* pipe(eff, provide({ hookEnvironment })) as Effect<E, A>

        return value
      })

    const getKeyedEnv = (key: any) =>
      doEffect(function* () {
        const { hookEnvironment } = yield* ask<HookEnv>()

        if (!hookEnvironment.children.has(key)) {
          const id = yield* createUuid
          const keyed = createHookEnvironment(id, some(hookEnvironment))

          sendEvent({ type: HookEventType.CreatedEnvironment, hookEnvironment: keyed })

          hookEnvironment.children.set(key, keyed)
        }

        return hookEnvironment.children.get(key)!
      })

    const removeKeyedEnv = (key: any) =>
      doEffect(function* () {
        const { hookEnvironment } = yield* ask<HookEnv>()
        const keyed = hookEnvironment.children.get(key)

        if (keyed) {
          hookEnvironment.children.delete(key)

          sendEvent({ type: HookEventType.RemovedEnvironment, hookEnvironment: keyed })
        }
      })

    return [
      useRefByIndex,
      useStateByIndex,
      useChannelOp,
      provideChannelOp,
      runWithHooks,
      getKeyedEnv,
      removeKeyedEnv,
    ] as const
  }),
)

function getNextIndex(hookPositions: Map<Uuid, number>, id: Uuid) {
  if (!hookPositions.has(id)) {
    hookPositions.set(id, INITIAL_ENV_INDEX)
  }

  const index = hookPositions.get(id)!

  hookPositions.set(id, index + 1)

  return index
}

function getStateByIndex(hookEnvironment: HookEnvironment, index: number) {
  return pipe(hookEnvironment.states, lookupByIndex(index))
}

function setRefByIndex<E, A>(
  hookEnvironment: HookEnvironment,
  index: number,
  initialValue: Effect<E, A>,
): Effect<E, Ref<A>> {
  return doEffect(function* () {
    const ref = createRef(yield* initialValue)

    hookEnvironment.states.set(index, ref)

    return ref
  })
}

type CreateUseStateOptions<K, E, A> = {
  states: Map<K, any>
  key: K
  initialValue: Effect<E, A>
  eq: Eq<A>
  sendEvent: (event: HookEvent) => void
  createEvent: <A>(value: A) => HookEvent
}

function createUseState<K, E, A>(options: CreateUseStateOptions<K, E, A>) {
  const { states, key, initialValue, eq, sendEvent, createEvent } = options

  return doEffect(function* () {
    let state = yield* initialValue

    const getState = Pure.fromIO(() => state)
    const updateState = (update: Arity1<A, A>) =>
      Pure.fromIO(() => {
        const updated = update(state)

        if (eq.equals(state, updated)) {
          return state
        }

        state = updated

        sendEvent(createEvent(state))

        return state
      })

    states.set(key, [getState, updateState])

    return states.get(key)!
  })
}

function appendTo<K, A>(consumers: Map<K, Set<A>>, name: K, hookEnvironment: A) {
  if (!consumers.has(name)) {
    consumers.set(name, new Set())
  }

  const channelConsumers = consumers.get(name)!

  channelConsumers.add(hookEnvironment)
}

function findProvider(
  hookEnvironment: HookEnvironment,
  name: ChannelName,
): Option<HookEnvironment> {
  if (hookEnvironment.channelStates.has(name)) {
    return some(hookEnvironment)
  }

  return pipe(
    hookEnvironment.parent,
    fold(
      () => none,
      (e) => findProvider(e, name),
    ),
  )
}
