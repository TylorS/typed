import { isBrowser } from '@typed/fp/common/exports'
import { undisposable } from '@typed/fp/Disposable/exports'
import { doEffect, execPure, Pure } from '@typed/fp/Effect/exports'
import { provideSchedulerEnv } from '@typed/fp/fibers/exports'
import {
  createBrowserUuidEnv,
  createNodeUuidEnv,
  provideUuidEnv,
  uuid4,
} from '@typed/fp/Uuid/exports'
import { describe, given, it } from '@typed/test'
import { eqNumber } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'
import { fromNullable } from 'fp-ts/Option'
import { create } from 'most-subject'

import { createChannel } from './Channel'
import { getChannelProvider } from './ChannelProviders'
import { HookEvent, isUpdatedHookEnvironmentEvent } from './events'
import {
  createHookEnv,
  createHookEnvironment,
  HookEnvironment,
  HookEnvironmentId,
} from './HookEnvironment'
import { listenToHookEvents } from './HookEvents'
import { provideChannel } from './provideChannel'
import { provideEmptyHookStates, provideHookStates } from './provideHookStates'
import { runWithHooks } from './runWithHooks'
import { updateState } from './State'
import { useChannel } from './useChannel'

export const test = describe(`ChannelProviders`, [
  describe(`getChannelProvider`, [
    given(`Channel<E, A> and Eq<A>`, [
      it(`returns the root HookEnvironment when no provider has be specified`, ({ equal }) => {
        const channel = createChannel('test', Pure.of(1))
        const child = doEffect(function* () {
          const [provider] = yield* getChannelProvider(channel, eqNumber)

          return provider
        })

        const parent = doEffect(function* () {
          const { hookEnvironment } = yield* createHookEnv

          return yield* runWithHooks(hookEnvironment, child)
        })

        const test = doEffect(function* () {
          const { hookEnvironment } = yield* createHookEnv
          const actual = yield* runWithHooks(hookEnvironment, parent)

          equal(hookEnvironment, actual)
        })

        pipe(test, provideEmptyHookStates, provideSchedulerEnv, provideUuidEnv, execPure)
      }),
      it(`returns the closest specified HookEnvironment`, ({ equal }) => {
        const channel = createChannel('test', Pure.of(1))
        const grandChild = doEffect(function* () {
          const [provider] = yield* getChannelProvider(channel, eqNumber)

          return provider
        })

        const child = doEffect(function* () {
          yield* provideChannel(channel, eqNumber)

          const { hookEnvironment } = yield* createHookEnv

          return yield* runWithHooks(hookEnvironment, grandChild)
        })

        const parent = doEffect(function* () {
          const { hookEnvironment } = yield* createHookEnv
          const provider = yield* runWithHooks(hookEnvironment, child)

          return [hookEnvironment, provider] as const
        })

        const test = doEffect(function* () {
          const { hookEnvironment } = yield* createHookEnv
          const [expected, actual] = yield* runWithHooks(hookEnvironment, parent)

          equal(expected.id, actual.id)
        })

        pipe(test, provideEmptyHookStates, provideSchedulerEnv, provideUuidEnv, execPure)
      }),
    ]),
  ]),
  describe(`setChannelProvider`, [
    given(`Channel<E, A> and Eq<A>`, [
      it(`emits update events when a new value is provided`, ({ equal }, done) => {
        const channel = createChannel('test', Pure.of(1))
        const hookEvents = create<HookEvent<any>>()

        const parentEnv = createEnv()
        const childEnv = createEnv(parentEnv)
        const grandChildEnv = createEnv(childEnv)
        const grandChild = useChannel(channel)

        const child = doEffect(function* () {
          return yield* runWithHooks(grandChildEnv, grandChild)
        })

        const parent = doEffect(function* () {
          const state = yield* provideChannel(channel)

          yield* listenToHookEvents(
            isUpdatedHookEnvironmentEvent,
            undisposable((ev) => {
              try {
                equal(grandChildEnv.id, ev.hookEnvironment.id)
                done()
              } catch (e) {
                done(e)
              }
            }),
          )

          yield* runWithHooks(childEnv, child)

          yield* updateState((x) => x + 1, state)
        })

        pipe(
          runWithHooks(parentEnv, parent),
          provideHookStates({ hookEvents }),
          provideSchedulerEnv,
          provideUuidEnv,
          execPure,
        )
      }),
    ]),
  ]),
  // describe(`deleteChannelProvider`, [
  //   given(`HookEnvironmentId`, [
  //     it(`deletes all provides associated with that HookEnvironmentId`, ({ equal }) => {
  //       // todo
  //     }),
  //   ]),
  // ]),
])

function createEnv(parent?: HookEnvironment): HookEnvironment {
  const env = createHookEnvironment(createId(), fromNullable(parent))

  if (parent) {
    parent.children.set(Symbol(), env)
  }

  return env
}

function createId() {
  const { randomUuidSeed } = isBrowser ? createBrowserUuidEnv() : createNodeUuidEnv()

  return HookEnvironmentId.wrap(uuid4(randomUuidSeed()))
}
