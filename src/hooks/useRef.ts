import { Effect } from '../Effect'
import { withHookEnv } from './withHookEnv'

export const useRef = <E, A>(initial: Effect<E, A>) => withHookEnv(({ useRef }) => useRef(initial))
