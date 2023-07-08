import { Effect } from './Effect.js'
import { Exit } from './Exit.js'

export type Finalizer = (exit: Exit<any, any>) => Effect<never, never, any>
