import { Effect } from '@typed/fp/Effect/Effect'
import { provideSharedRef, SharedRefEnv, SharedRefValue } from '@typed/fp/SharedRef/exports'
import { pipe } from 'fp-ts/function'
import { newIORef } from 'fp-ts/IORef'
import { create } from 'most-subject'

import { HookEvent } from './events'
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
    provideSharedRef(ChannelProviders, newIORef(createMapIfUndefined(states.channelProviders))),
    provideSharedRef(ChannelConsumers, newIORef(createMapIfUndefined(states.channelConsumers))),
    provideSharedRef(HookEvents, newIORef(states.hookEvents ?? create<HookEvent>())),
    provideSharedRef(HookDisposables, newIORef(createMapIfUndefined(states.hookDisposables))),
    provideSharedRef(HookPositions, newIORef(createMapIfUndefined(states.hookPositions))),
    provideSharedRef(HookSymbols, newIORef(createMapIfUndefined(states.hookSymbols))),
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

function createMapIfUndefined<A extends Map<any, any>>(map: A | undefined): A {
  return map ?? (new Map() as A)
}
