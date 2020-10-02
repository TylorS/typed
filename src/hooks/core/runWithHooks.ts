import { Effect } from '@typed/fp/Effect/Effect'
import { use } from '@typed/fp/Effect/provide'
import { curry } from '@typed/fp/lambda/exports'
import { pipe } from 'fp-ts/lib/function'

import { HookEnv } from '../infrastructure/exports'
import { HookEnvironment } from './HookEnvironment'

export const runWithHooks = curry(
  <E, A>(hookEnvironment: HookEnvironment, effect: Effect<HookEnv & E, A>): Effect<E, A> =>
    pipe(effect, use({ hookEnvironment })) as Effect<E, A>,
) as {
  <E, A>(hookEnvironment: HookEnvironment, effect: Effect<HookEnv & E, A>): Effect<E, A>
  (hookEnvironment: HookEnvironment): <E, A>(effect: Effect<HookEnv & E, A>) => Effect<E, A>
}
