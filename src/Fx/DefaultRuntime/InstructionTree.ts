import type { Fx } from '../Fx'
import { Instruction } from '../Instruction'

/**
 * Describes stack-like Tree of Fx instructions.
 */
export type InstructionTree<R, A> = InitialNode<R, A> | GeneratorNode<R, A> | InstructionNode<R>

export interface InitialNode<R, A> {
  readonly type: 'Initial'
  readonly fx: Fx<R, A>
}

export interface GeneratorNode<R, A> {
  readonly type: 'Generator'
  readonly generator: Generator<Instruction<R, any>, A>
  readonly previous: GeneratorNode<any, any> | InitialNode<any, any>

  // Mutable reference to value that should be nexted into
  next?: any
}

export interface InstructionNode<R> {
  readonly type: 'Instruction'
  readonly instruction: Instruction<R, any>
  readonly previous: GeneratorNode<R, any>
}
