import { doEffect, Effect, EnvOf, zip } from '@typed/fp/Effect/exports'

import { deleteChannelConsumer } from './ChannelConsumers'
import { deleteChannelProvider } from './ChannelProviders'
import { RemovedHookEnvironment } from './events'
import { disposeHookEnvironment } from './HookDisposables'
import { HookEnvironment } from './HookEnvironment'
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
    const { id } = hookEnvironment

    yield* zip([
      deleteChannelConsumer(id),
      deleteChannelProvider(id),
      deleteHookPosition(id),
      deleteHookSymbols(id),
      disposeHookEnvironment(id),
      sendHookEvent(RemovedHookEnvironment.of(hookEnvironment)),
    ] as const)
  })

  return eff
}
