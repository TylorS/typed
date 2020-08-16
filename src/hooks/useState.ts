import { Effect } from '../Effect'
import { withHookEnv } from './withHookEnv'

export const useState = <E, A>(initial: Effect<E, A>) =>
  withHookEnv(({ useState }) => useState(initial))
