import { Effect } from '@typed/fp/Effect/Effect'
import { provideSharedRef, SharedRefEnv, SharedRefValue } from '@typed/fp/SharedRef/exports'
import { pipe } from 'fp-ts/function'
import { newIORef } from 'fp-ts/IORef'
import { create } from 'most-subject'

import {
  ChannelConsumers,
  ChannelProviders,
  HookEvents,
  HookPositions,
  HookSymbols,
} from './exports'
import { HookDisposables } from './HookDisposables'

export const provideHookStates = (states: Partial<HookStates>) => <E, A>(
  eff: Effect<
    E &
      SharedRefEnv<ChannelProviders> &
      SharedRefEnv<ChannelConsumers> &
      SharedRefEnv<HookDisposables> &
      SharedRefEnv<HookEvents> &
      SharedRefEnv<HookPositions> &
      SharedRefEnv<HookSymbols>,
    A
  >,
): Effect<E, A> =>
  pipe(
    eff,
    provideSharedRef(ChannelProviders, newIORef(states.channelProviders ?? new Map())),
    provideSharedRef(ChannelConsumers, newIORef(states.channelConsumers ?? new Map())),
    provideSharedRef(HookEvents, newIORef(states.hookEvents ?? create())),
    provideSharedRef(HookDisposables, newIORef(states.hookDisposables ?? new Map())),
    provideSharedRef(HookPositions, newIORef(states.hookPositions ?? new Map())),
    provideSharedRef(HookSymbols, newIORef(states.hookSymbols ?? new Map())),
  )

export const provideEmptyHookStates = provideHookStates({})

export type HookStates = {
  readonly channelConsumers: SharedRefValue<ChannelConsumers>
  readonly channelProviders: SharedRefValue<ChannelProviders>
  readonly hookDisposables: SharedRefValue<HookDisposables>
  readonly hookEvents: SharedRefValue<HookEvents>
  readonly hookPositions: SharedRefValue<HookPositions>
  readonly hookSymbols: SharedRefValue<HookSymbols>
}
