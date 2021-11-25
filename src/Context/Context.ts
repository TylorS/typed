import { Branded } from '@/Branded'

export interface Context {
  readonly id: ContextId
}

export type ContextId = Branded<PropertyKey, 'ContextId'>
export const ContextId = Branded<ContextId>()
