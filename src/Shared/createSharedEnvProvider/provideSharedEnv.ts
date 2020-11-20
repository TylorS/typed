import { Provider } from '@typed/fp/Effect/provide'
import { provideSchedulerEnv } from '@typed/fp/Scheduler/exports'
import { pipe } from 'fp-ts/function'

import { SharedEnv } from '../core/exports'
import { createSharedEnvProvider } from './createSharedEnvProvider'
import { defaultHandlers } from './defaultHandlers'

/**
 * This is for running an application defined using an Effect requiring a SharedEnv, using
 * @most/schedulers default scheduler andour "defaultHandlers" which powers the core functionality,
 * a react-hooks-like functionality, and areact-context-like functionality through the use of listening
 * to and responding to SharedEvent occurences. The default namespace for this root-level effect will be
 * that of our GlobalNamespace.
 *
 * You can use createSharedEnvProvider and provide your own handlers to replace or add any and all functionality
 * as you see fit. It can be convenient to always use GlobalNamespace to have an easy way to reach up into the root.
 */
export const provideSharedEnv: Provider<SharedEnv> = (effect) =>
  pipe(effect, createSharedEnvProvider({ handlers: defaultHandlers }), provideSchedulerEnv)
