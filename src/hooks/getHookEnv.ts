import { Effect, fromEnv, sync } from '../Effect'
import { HookEnv, HookEnvironment } from './HookEnvironment'

export const getHookEnv: Effect<HookEnv, HookEnvironment> = fromEnv((e: HookEnv) =>
  sync(e.hookEnvironment),
)
