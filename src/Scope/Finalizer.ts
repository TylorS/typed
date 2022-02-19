import { Exit } from '@/Exit'
import { Fx } from '@/Fx'
import { Branded } from '@/Prelude/Branded'

export type Finalizer<R = unknown, E = never> = (exit: Exit<any, any>) => Fx<R, E, any>

export type FinalizerKey = Branded<symbol, 'FinalizerKey'>
export const FinalizerKey = Branded<FinalizerKey>()
