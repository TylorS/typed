import { doEnv, toEnv } from '@fp/Fx/Env'

import { Status } from '../../Status'
import { setFiberStatus } from '../FiberStatus'
import { sendStatus } from './FiberSendEvent'

export const changeStatus = <A>(status: Status<A>) =>
  toEnv(
    doEnv(function* (_) {
      yield* _(setFiberStatus(status))
      yield* _(sendStatus(status))
    }),
  )
