import { U } from 'ts-toolbelt'

import { Fx } from '@/Fx'

import { Instruction } from './Instruction'
import type { InstructionProcessor } from './InstructionProcessor'
import { RuntimeInstruction } from './RuntimeInstruction'

export type InstructionType = Instruction<any, any>['type']

export type FindInstruction<T extends InstructionType, R, E> = FindInstructionFromList<
  T,
  U.ListOf<Instruction<R, E>>
>

export type FindInstructionFromList<
  T extends InstructionType,
  Instructions extends ReadonlyArray<Instruction<any, any>>,
> = {
  readonly [K in keyof Instructions]: Instructions[K] extends { readonly type: T }
    ? Instructions[K]
    : never
}[number]

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
