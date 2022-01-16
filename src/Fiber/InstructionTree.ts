import { Effect } from '@/Effect'
import { Exit } from '@/Exit'
import { Fx } from '@/Fx'

import { Instruction } from './Instruction'

export type InstructionTree<R, E, A> =
  | InitialNode<R, E>
  | GeneratorNode<R, E>
  | InstructionNode<R, E>
  | ExitNode<E, A>

export interface InitialNode<R, E> {
  readonly type: 'Initial'
  readonly fx: Fx<R, E, any>
}

export interface GeneratorNode<R, E> {
  readonly type: 'Generator'
  readonly generator: Generator<Effect<R, E, any>, any>
  readonly previous: GeneratorNode<R, E> | InitialNode<R, E> | ExitNode<E, any>

  method: 'next' | 'throw' | 'return'
  next?: any
}

export interface InstructionNode<R, E> {
  readonly type: 'Instruction'
  readonly instruction: Instruction<R, E>
  readonly previous: GeneratorNode<R, E>
}

export interface ExitNode<E, A> {
  readonly type: 'Exit'
  readonly exit: Exit<E, A>
}
