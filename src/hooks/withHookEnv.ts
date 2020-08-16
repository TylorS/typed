import { doEffectWith, Effect } from '../Effect'
import { HookEnv, HookEnvironment } from './HookEnvironment'

export function* withHookEnv<E, A>(
  f: (env: HookEnvironment) => Effect<E, A>,
): Effect<E & HookEnv, A> {
  return yield* doEffectWith(function* (e: HookEnv) {
    return yield* f(e.hookEnvironment)
  }) as Effect<E & HookEnv, A>
}
