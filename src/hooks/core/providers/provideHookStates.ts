import { Effect } from '@typed/fp/Effect/Effect'
import { provideSharedRef, SharedRefEnv, SharedRefValue } from '@typed/fp/SharedRef/exports'
import { pipe } from 'fp-ts/function'
import { create } from 'most-subject'

import {
  ChannelConsumers,
  ChannelProviders,
  HookDisposables,
  HookEvents,
  HookPositions,
  HookSymbols,
} from '../sharedRefs/exports'
import { HookEvent } from '../types/exports'

export type HookRefEnvs = SharedRefEnv<ChannelProviders> &
  SharedRefEnv<ChannelConsumers> &
  SharedRefEnv<HookDisposables> &
  SharedRefEnv<HookEvents> &
  SharedRefEnv<HookPositions> &
  SharedRefEnv<HookSymbols>

export const provideHookStates = (states: Partial<HookStates>) => <E, A>(
  eff: Effect<E & HookRefEnvs, A>,
): Effect<E, A> =>
  pipe(
    eff,
    provideSharedRef(ChannelProviders, createMapIfUndefined(states.channelProviders)),
    provideSharedRef(ChannelConsumers, createMapIfUndefined(states.channelConsumers)),
    provideSharedRef(HookEvents, states.hookEvents ?? create<HookEvent>()),
    provideSharedRef(HookDisposables, createMapIfUndefined(states.hookDisposables)),
    provideSharedRef(HookPositions, createMapIfUndefined(states.hookPositions)),
    provideSharedRef(HookSymbols, createMapIfUndefined(states.hookSymbols)),
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
