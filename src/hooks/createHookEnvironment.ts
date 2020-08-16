import { chain, doEffect, doEffectWith, Effect, map, provide, Pure } from '@typed/fp/Effect'
import { createUuid, UuidEnv } from '@typed/fp/Uuid'
import { pipe } from 'fp-ts/es6/function'
import { IORef, newIORef } from 'fp-ts/es6/IORef'
import { fromNullable, isSome, Option } from 'fp-ts/es6/Option'

import { Channel } from './Channel'
import { HookEnv, HookEnvironment, UseState } from './HookEnvironment'

export function createHookEnvironment(): Effect<UuidEnv & Partial<HookEnv>, HookEnvironment> {
  return doEffectWith(function* (e: Partial<HookEnv>) {
    const { nextId, resetId } = createIdGenerator()
    const parent = fromNullable(e.hookEnvironment)
    const states = new Map<number, unknown>()
    const channelStates = new WeakMap<Channel<any, any>, UseState<any>>()
    const env: HookEnvironment = {
      id: yield* createUuid,
      parent,
      runWith,
      useRef: createUseRef(nextId, states),
      useState: createUseState(nextId, states),
      useChannel: createUseChannel(channelStates, parent),
    }

    return env

    function runWith<E, A>(eff: Effect<E & HookEnv, A>): Effect<E, A> {
      const provided = pipe(
        eff,
        provide<HookEnv>({ hookEnvironment: env }),
      ) as Effect<E, A>

      return doEffect(function* () {
        resetId()

        return yield* provided
      })
    }
  })
}

function createIdGenerator() {
  let id = 1

  const nextId = () => id++
  const resetId = () => {
    id = 1
  }

  return { nextId, resetId } as const
}

function createUseRef(nextId: () => number, states: Map<number, unknown>) {
  return <E, A>(eff: Effect<E, A>): Effect<E, IORef<A>> =>
    doEffect(function* () {
      const id = nextId()

      if (states.has(id)) {
        return states.get(id)! as IORef<A>
      }

      const value = yield* eff
      const ref = newIORef(value)()

      states.set(id, ref)

      return ref
    })
}

function createUseState(nextId: () => number, states: Map<number, unknown>) {
  return <E, A>(eff: Effect<E, A>): Effect<E, UseState<A>> =>
    doEffect(function* () {
      const id = nextId()

      if (states.has(id)) {
        return states.get(id)! as UseState<A>
      }

      let value: A = yield* eff

      function updateValue(updated: A) {
        value = updated

        return updated
      }

      const getValue = Pure.fromIO(() => value)
      const useState: UseState<A> = [
        getValue,
        (update) => pipe(getValue, chain(update), map(updateValue)),
      ]

      states.set(id, useState)

      return useState
    })
}

function createUseChannel(
  states: WeakMap<Channel<any, any>, UseState<any>>,
  parent: Option<HookEnvironment>,
) {
  return <E1, A, E2>(
    channel: Channel<E1, A>,
    initialState?: Effect<E2, A>,
  ): Effect<E1 & E2, UseState<A>> =>
    doEffect(function* () {
      if (states.has(channel)) {
        return states.get(channel)!
      }

      if (!initialState && isSome(parent)) {
        return yield* parent.value.useChannel(channel)
      }

      let value = yield* initialState ?? channel.defaultValue

      function updateValue(updated: A) {
        value = updated

        return updated
      }

      const getValue = Pure.fromIO(() => value)
      const useState: UseState<A> = [
        getValue,
        (update) => pipe(getValue, chain(update), map(updateValue)),
      ]

      states.set(channel, useState)

      return useState
    })
}
