import { Fx } from '@/Fx'

import { FindInstruction, Instruction } from './Instruction'
import type { InstructionProcessor } from './InstructionProcessor'
import { RuntimeInstruction } from './RuntimeInstruction'

export type InstructionType = Instruction<any, any>['type']

export type Processors = {
  readonly [K in InstructionType]: Processor<K, any, any>
}

export type Processor<T extends InstructionType, R, E> = (
  instruction: FindInstruction<T, R, E>,
  processor: InstructionProcessor<R, E, any>,
) => ProcessorInstruction<R, E, any>

export type ProcessorInstruction<R, E, A> =
  | RuntimeInstruction<E>
  | FxInstruction<R, E, A>
  | ResultInstruction<R, E, A>
  | ScopedInstruction<R, E, A>
  | DeferredInstruction<R, E, A>

export interface FxInstruction<R, E, A> {
  readonly type: 'Fx'
  readonly fx: Fx<R, E, A>
}

export interface ResultInstruction<R, E, A> {
  readonly type: 'Result'
  readonly processor: InstructionProcessor<R, E, A>
}

export interface ScopedInstruction<R, E, A> {
  readonly type: 'Scoped'
  readonly processor: InstructionProcessor<R, E, A>
}

export interface DeferredInstruction<R, E, A> {
  readonly type: 'Deferred'
  readonly fx: Fx<R, E, ProcessorInstruction<R, E, A>>
}
