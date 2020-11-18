import { Provider } from '@typed/fp/Effect/provide'
import { provideSchedulerEnv } from '@typed/fp/Scheduler/exports'
import { pipe } from 'fp-ts/function'

import { SharedEnv } from '../core/exports'
import { createSharedEnvProvider } from './createSharedEnvProvider'
import { defaultHandlers } from './defaultHandlers'

export const provideSharedEnv: Provider<SharedEnv> = (effect) =>
  pipe(effect, createSharedEnvProvider({ handlers: defaultHandlers }), provideSchedulerEnv)
