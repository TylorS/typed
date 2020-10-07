import { doEffect, Effect, EnvOf, zip } from '@typed/fp/Effect/exports'

import { getAllDescendants, HookEnvironment, RemovedHookEnvironment } from '../types/exports'
import { deleteChannelConsumer } from './ChannelConsumers'
import { deleteChannelProvider } from './ChannelProviders'
import { disposeHookEnvironment } from './HookDisposables'
import { sendHookEvent } from './HookEvents'
import { deleteHookPosition } from './HookPositions'
import { deleteHookSymbols } from './HookSymbols'

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
    yield* remove(hookEnvironment)

    for (const child of getAllDescendants(hookEnvironment)) {
      yield* remove(child)
    }
  })

  return eff
}

function* remove(hookEnvironment: HookEnvironment) {
  const { id } = hookEnvironment

  yield* zip([
    deleteChannelConsumer(id),
    deleteChannelProvider(id),
    deleteHookPosition(id),
    deleteHookSymbols(id),
    disposeHookEnvironment(id),
    sendHookEvent(RemovedHookEnvironment.of(hookEnvironment)),
  ] as const)
}
