import { contextHandlers } from './handlers/context/exports'
import { coreHandlers } from './handlers/core/exports'
import { hooksHandlers } from './handlers/hooks/exports'

export const defaultHandlers = [...coreHandlers, ...contextHandlers, ...hooksHandlers] as const
