import { lazy } from '@typed/fp/Disposable/exports'
import { ask, asks, doEffect, Effect, EnvOf } from '@typed/fp/Effect/exports'
import { getUuidKeyIso, UuidKey, UuidKeyIso } from '@typed/fp/Key/exports'
import { SharedRefEnv } from '@typed/fp/SharedRef/exports'
import { createUuid, UuidEnv } from '@typed/fp/Uuid/exports'
import { fromNullable, isSome, none, Option } from 'fp-ts/Option'

import { CreatedHookEnvironment } from './events'
import { addDisposable, HookDisposables } from './HookDisposables'
import { sendHookEvent } from './HookEvents'
import { removeHookEnvironment } from './removeHookEnvironment'

export interface HookEnv {
  readonly hookEnvironment: HookEnvironment
}

export interface HookEnvironmentId extends UuidKey<HookEnvironment> {}

export namespace HookEnvironmentId {
  export const { wrap, unwrap }: UuidKeyIso<HookEnvironment> = getUuidKeyIso<HookEnvironment>()
}

export interface HookEnvironment {
  // Identify a hook environment
  readonly id: HookEnvironmentId

  // Keep track of any state you'd like
  readonly states: Map<any, any>

  // Allow tracking tree of hook environments
  readonly parent: Option<HookEnvironment>
  readonly children: Map<any, HookEnvironment>
}

export const getHookEnv = asks((e: HookEnv) => e.hookEnvironment)

export const getKeyedEnvironment = (
  key: any,
): Effect<HookEnv & UuidEnv & SharedRefEnv<HookDisposables>, HookEnvironment> => {
  const eff = doEffect(function* () {
    const env = yield* getHookEnv

    if (env.children.has(key)) {
      return env.children.get(key)!
    }

    const id = HookEnvironmentId.wrap(yield* createUuid)
    const parent = fromNullable(env)
    const created = createHookEnvironment(id, parent)

    const { children } = env

    children.set(key, created)

    yield* addDisposable(id, { dispose: () => children.delete(id) })

    return created
  })

  return eff
}

export const removeKeyedEnvironment = (
  key: any,
): Effect<HookEnv & EnvOf<typeof removeHookEnvironment>, void> => {
  const eff = doEffect(function* () {
    const { children } = yield* getHookEnv
    const env = children.get(key)

    if (env) {
      yield* removeHookEnvironment(env)
    }
  })

  return eff
}

export const createChildHookEnvironment: Effect<
  UuidEnv & SharedRefEnv<HookDisposables> & EnvOf<typeof sendHookEvent>,
  HookEnvironment
> = doEffect(function* () {
  const { hookEnvironment } = (yield* ask<unknown>()) as Partial<HookEnv>
  const id = HookEnvironmentId.wrap(yield* createUuid)
  const parent = fromNullable(hookEnvironment)
  const created = createHookEnvironment(id, parent)

  if (isSome(parent)) {
    const { children } = parent.value

    children.set(id, created)

    yield* addDisposable(id, { dispose: () => parent.value.children.delete(id) })
  }

  yield* sendHookEvent(CreatedHookEnvironment.of(created))

  return created
})

export function createHookEnvironment(
  id: HookEnvironmentId,
  parent: Option<HookEnvironment> = none,
): HookEnvironment {
  const env: HookEnvironment = lazy({
    id,
    states: new Map(),
    channelStates: new Map(),
    parent,
    children: new Map(),
  })

  return env
}
