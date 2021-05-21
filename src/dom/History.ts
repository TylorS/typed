import * as E from '@fp/Env'
import { identity } from '@fp/function'
import { Do, liftEnv } from '@fp/Fx/Env'
import { createContext, useOp } from '@fp/hooks'
import { fromNullable } from 'fp-ts/Option'

import { HistoryEnv } from './env'
import { Location } from './Location'

const forceLocationUpdate = liftEnv(Location.modify(identity))

export const History = createContext(
  E.asks((e: HistoryEnv) => e.history),
  Symbol('History'),
)

export const useHistory = <A = unknown>() =>
  Do(function* (_) {
    const push = yield* _(pushState<A>())
    const replace = yield* _(replaceState<A>())
    const back = yield* _(goBack)
    const forward = yield* _(goForward)
    const go = yield* _(go_)
    const getState = yield* _(getState_<A>())

    return {
      push,
      replace,
      back: back(),
      forward: forward(),
      go,
      getState: getState(),
    } as const
  })

const pushState = <A>() =>
  useOp((path: string, state?: A | null, title: string = path) =>
    Do(function* (_) {
      const history = yield* _(History.get)

      history.pushState(state, title, path)

      yield* forceLocationUpdate
    }),
  )

const getState_ = <A>() =>
  useOp(() =>
    Do(function* (_) {
      const history = yield* _(History.get)

      return fromNullable<A>(history.state)
    }),
  )

const replaceState = <A>() =>
  useOp((path: string, state?: A | null, title: string = path) =>
    Do(function* (_) {
      const history = yield* _(History.get)

      history.replaceState(state, title, path)

      yield* forceLocationUpdate
    }),
  )

const goBack = useOp(() =>
  Do(function* (_) {
    const history = yield* _(History.get)

    history.back()

    yield* forceLocationUpdate
  }),
)

const goForward = useOp(() =>
  Do(function* (_) {
    const history = yield* _(History.get)

    history.forward()

    yield* forceLocationUpdate
  }),
)

const go_ = useOp((delta: number) =>
  Do(function* (_) {
    const history = yield* _(History.get)

    history.go(delta)

    yield* forceLocationUpdate
  }),
)
