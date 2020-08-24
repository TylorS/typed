import { lazy, LazyDisposable } from '@typed/fp/Disposable'
import { Uuid } from '@typed/fp/Uuid'
import { isSome, none, Option } from 'fp-ts/es6/Option'

import { ChannelName } from '../Channel'

export interface HookEnv {
  readonly hookEnvironment: HookEnvironment
}

export interface HookEnvironment extends LazyDisposable {
  // Identify a hook environment
  readonly id: Uuid

  // Keep track of any state you'd like
  readonly states: Map<PropertyKey, any>

  // Keep track of any state related to a channel
  readonly channelStates: Map<ChannelName, any>

  // Allow tracking tree of hook environments
  readonly parent: Option<HookEnvironment>
  readonly children: Map<any, HookEnvironment>
}

export function createHookEnvironment(
  id: Uuid,
  parent: Option<HookEnvironment> = none,
): HookEnvironment {
  const env: HookEnvironment = lazy({
    id,
    states: new Map(),
    channelStates: new Map(),
    parent,
    children: new Map(),
  })

  if (isSome(parent)) {
    const { children } = parent.value

    children.set(id, env)
    env.addDisposable({
      dispose: () => {
        children.delete(id)
      },
    })
  }

  return env
}
