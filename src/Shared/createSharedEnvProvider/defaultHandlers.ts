import { contextHandlers } from './handlers/context/exports'
import { coreHandlers } from './handlers/core/exports'
import { hooksHandlers } from './handlers/hooks/exports'

/**
 * The default set of Shared event handlers providing the core functionality, as well as React-like Context + Hooks APIs.
 */
export const defaultHandlers = [...coreHandlers, ...contextHandlers, ...hooksHandlers] as const
