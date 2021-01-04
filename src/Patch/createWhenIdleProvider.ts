import { WhenIdleEnv } from '@fp/dom/exports'
import { provideMany, provideSome } from '@fp/Effect/exports'
import { createSharedEnvProvider, defaultHandlers, provideSharedEnv } from '@fp/Shared/exports'

import { provideSchedulerEnv } from '../Scheduler/exports'
import { createWhenIdleHandlers } from './handlers/exports'
import { Patch } from './Patch'

export const createWhenIdleProvider = <A, B>(env: WhenIdleEnv & Patch<A, B>) =>
  provideMany(
    createSharedEnvProvider({ handlers: [...defaultHandlers, ...createWhenIdleHandlers(env)] }),
    provideSharedEnv,
    provideSchedulerEnv,
    provideSome(env),
  )
