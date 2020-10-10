import { isBrowser } from '@typed/fp/common/exports'
import { doEffect, execEffect, execPure, Pure } from '@typed/fp/Effect/exports'
import { provideSharedRef, SharedRefValue } from '@typed/fp/SharedRef/exports'
import {
  createBrowserUuidEnv,
  createNodeUuidEnv,
  createUuid,
  provideUuidEnv,
} from '@typed/fp/Uuid/exports'
import { describe, given, it } from '@typed/test'
import { eqStrict } from 'fp-ts/Eq'
import { identity, pipe } from 'fp-ts/function'
import {} from 'fp-ts/IORef'
import { isNone, isSome } from 'fp-ts/Option'

import { ChannelConsumer, createChannel } from '../types/exports'
import { createHookEnvironment, HookEnvironmentId } from '../types/HookEnvironment'
import {
  ChannelConsumers,
  deleteChannelConsumer,
  getChannelConsumer,
  setChannelConsumer,
} from './ChannelConsumers'

export const test = describe(`ChannelConsumers`, [
  describe(`getChannelConsumer`, [
    given(`a ChannelName, HookEnvironmentId, and a symbol`, [
      it(`returns None if not configured`, ({ ok }) => {
        const eff = doEffect(function* () {
          const [channel, hookEnvironment, key] = yield* createHookAndChannel()
          const option = yield* getChannelConsumer(channel.name, hookEnvironment.id, key)

          ok(isNone(option))
        })

        pipe(eff, provideUuidEnv, provideSharedRef(ChannelConsumers, new Map()), execPure)
      }),

      it(`returns Some<ChannelConsumer> if not configured`, ({ ok, same }) => {
        const eff = doEffect(function* () {
          const [channel, hookEnvironment, key] = yield* createHookAndChannel()
          const consumer: ChannelConsumer<unknown> = {
            selector: identity,
            eq: eqStrict,
          }
          const consumers: SharedRefValue<ChannelConsumers> = new Map([
            [channel.name, new Map([[hookEnvironment.id, new Map([[key, consumer]])]])],
          ])

          const option = yield* pipe(
            getChannelConsumer(channel.name, hookEnvironment.id, key),
            provideSharedRef(ChannelConsumers, consumers),
          )

          ok(isSome(option))

          if (isSome(option)) {
            same(consumer, option.value)
          }
        })

        pipe(eff, execEffect(createUuidEnv()))
      }),
    ]),
  ]),
  describe(`setChannelConsumer`, [
    given(`a ChannelName, HookEnvironmentId, a symbol, and a ChannelConsumer`, [
      it(`allows setting a ChannelConsumer`, ({ ok, same }) => {
        const eff = doEffect(function* () {
          const [channel, hookEnvironment, key] = yield* createHookAndChannel()
          const consumer: ChannelConsumer<unknown> = {
            selector: identity,
            eq: eqStrict,
          }
          yield* setChannelConsumer(channel.name, hookEnvironment.id, key, consumer)

          const option = yield* getChannelConsumer(channel.name, hookEnvironment.id, key)

          ok(isSome(option))

          if (isSome(option)) {
            same(consumer, option.value)
          }
        })

        pipe(eff, provideSharedRef(ChannelConsumers, new Map()), execEffect(createUuidEnv()))
      }),
    ]),
  ]),
  describe(`deleteChannelConsumer`, [
    given(`a HookEnvironmentId`, [
      it(`deletes a consumer`, ({ ok }) => {
        const eff = doEffect(function* () {
          const [channel, hookEnvironment, key] = yield* createHookAndChannel()
          const consumer: ChannelConsumer<unknown> = {
            selector: identity,
            eq: eqStrict,
          }
          yield* setChannelConsumer(channel.name, hookEnvironment.id, key, consumer)
          yield* deleteChannelConsumer(hookEnvironment.id)

          const option = yield* getChannelConsumer(channel.name, hookEnvironment.id, key)

          ok(isNone(option))
        })

        pipe(eff, provideSharedRef(ChannelConsumers, new Map()), execEffect(createUuidEnv()))
      }),
    ]),
  ]),
])

function* createHookAndChannel() {
  const channel = createChannel('test', Pure.of(1))
  const id = HookEnvironmentId.wrap(yield* createUuid)
  const hookEnvironment = createHookEnvironment(id)
  const key = Symbol()

  return [channel, hookEnvironment, key] as const
}

function createUuidEnv() {
  return isBrowser ? createBrowserUuidEnv() : createNodeUuidEnv()
}
