import { Provider } from '@typed/fp/Effect/provide'
import { provideSchedulerEnv } from '@typed/fp/scheduler/exports'
import { pipe } from 'fp-ts/function'

import { SharedEnv } from '../core/exports'
import { GlobalNamespace } from '../global/Global'
import { createSharedEnvProvider } from './createSharedEnvProvider'
import { defaultHandlers } from './defaultHandlers'

export const defaultSharedEnvProvider: Provider<SharedEnv> = (effect) =>
  pipe(
    effect,
    createSharedEnvProvider({
      namespace: GlobalNamespace,
      handlers: defaultHandlers,
    }),
    provideSchedulerEnv,
  )
