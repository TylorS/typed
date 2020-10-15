import { ask, doEffect, Effect, EnvOf, execEffect } from '@typed/fp/Effect/exports'
import { readSharedRefs } from '@typed/fp/SharedRef/exports'
import { pipe } from 'fp-ts/lib/function'

import { getAllDescendants, HookEnvironment, RemovedHookEnvironment } from '../types/exports'
import { ChannelConsumers, deleteChannelConsumer } from './ChannelConsumers'
import { ChannelProviders, deleteChannelProvider } from './ChannelProviders'
import { disposeHookEnvironment, HookDisposables } from './HookDisposables'
import { sendHookEvent } from './HookEvents'
import { deleteHookPosition, HookPositions } from './HookPositions'
import { deleteHookSymbols, HookSymbols } from './HookSymbols'

export const removeHookEnvironment = (
  hookEnvironment: HookEnvironment,
): Effect<
  EnvOf<typeof deleteChannelConsumer> &
    EnvOf<typeof deleteChannelProvider> &
    EnvOf<typeof deleteHookPosition> &
    EnvOf<typeof deleteHookSymbols> &
    EnvOf<typeof disposeHookEnvironment> &
    EnvOf<typeof sendHookEvent>,
  void
> => {
  const eff = doEffect(function* () {
    const remove = yield* createRemove()

    remove(hookEnvironment)

    for (const child of getAllDescendants(hookEnvironment)) {
      remove(child)
    }
  })

  return eff
}

function* createRemove() {
  const [consumers, providers, position, symbols, disposables] = yield* readSharedRefs(
    ChannelConsumers,
    ChannelProviders,
    HookPositions,
    HookSymbols,
    HookDisposables,
  )
  const eventEnv = yield* ask<EnvOf<typeof sendHookEvent>>()

  return function remove(hookEnvironment: HookEnvironment) {
    const { id } = hookEnvironment

    consumers.forEach((c) => c.delete(id))
    providers.forEach((c) => c.delete(id))
    position.delete(id)
    symbols.delete(id)
    disposables.get(id)?.dispose()

    pipe(sendHookEvent(RemovedHookEnvironment.of(hookEnvironment)), execEffect(eventEnv))
  }
}
