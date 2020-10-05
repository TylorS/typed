import { deepEqualsEq } from '@typed/fp/common/exports'
import { ask, doEffect, Effect, EnvOf, provide } from '@typed/fp/Effect/exports'
import { SchedulerEnv } from '@typed/fp/fibers/exports'
import { SharedRefEnv } from '@typed/fp/SharedRef/exports'
import { Eq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'

import { createState } from '../helpers/createState'
import { UpdatedHookEnvironment } from './events'
import { getNextSymbol } from './getNextSymbol'
import { HookEnv } from './HookEnvironment'
import { HookEvents, sendHookEvent } from './HookEvents'
import { State } from './State'

export function useState<E, A>(
  initial: Effect<E, A>,
  eq: Eq<A> = deepEqualsEq,
): Effect<
  E & HookEnv & EnvOf<typeof getNextSymbol> & EnvOf<typeof sendHookEvent>,
  EnvOf<typeof createState> & State<A, A>
> {
  const eff = doEffect(function* () {
    const env = yield* ask<HookEnv & SchedulerEnv & SharedRefEnv<HookEvents>>()
    const { id, states } = env.hookEnvironment
    const symbol = yield* getNextSymbol(id)

    if (states.has(symbol)) {
      return states.get(symbol) as State<A, A>
    }

    const state: State<A, A> = yield* createState(initial, eq, () =>
      pipe(sendHookEvent(UpdatedHookEnvironment.of(env.hookEnvironment)), provide(env)),
    )

    states.set(symbol, state)

    return state
  })

  return eff
}
