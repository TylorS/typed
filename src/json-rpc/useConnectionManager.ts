import { lazy } from '@typed/fp/Disposable'
import { ask, doEffect, Effect, execPure, Pure } from '@typed/fp/Effect'
import { SchedulerEnv } from '@typed/fp/fibers'
import { HookOpEnvs, useEffect, useMemo, useState } from '@typed/fp/hooks'
import { constVoid, pipe } from 'fp-ts/es6/function'
import { filter, snoc } from 'fp-ts/es6/ReadonlyArray'
import { create } from 'most-subject'

import { Connection } from './Connection'
import { ConnectionEvent } from './ConnectionEvent'
import { ConnectionManager } from './ConnectionManager'

export const useConnectionManager: Effect<HookOpEnvs & SchedulerEnv, ConnectionManager> = doEffect(
  function* () {
    const [getConnections, updateConnections] = yield* useState<{}, ReadonlyArray<Connection>>(
      Pure.of([]),
    )
    const connectionEvents = yield* useMemo(() => create<ConnectionEvent>(), [])
    const manager: ConnectionManager = yield* useMemo(
      (connections): ConnectionManager => ({ connections, connectionEvents }),
      [yield* getConnections],
    )

    yield* useEffect(function* () {
      const { scheduler } = yield* ask<SchedulerEnv>()

      const disposable = lazy()

      disposable.addDisposable(
        connectionEvents[1].run(
          {
            event(_time, event) {
              disposable.addDisposable(
                pipe(updateConnections(applyConnectionEvent(event)), execPure),
              )
            },
            error: constVoid,
            end: constVoid,
          },
          scheduler,
        ),
      )

      return disposable
    }, [])

    return manager
  },
)

const applyConnectionEvent = ({ type, connection }: ConnectionEvent) => (
  state: ReadonlyArray<Connection>,
): ReadonlyArray<Connection> =>
  type === 'add'
    ? snoc(state, connection)
    : pipe(
        state,
        filter((c) => c.id !== connection.id),
      )
