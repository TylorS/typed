import { Context } from '@/Context'
import { Disposable } from '@/Disposable'
import { Exit } from '@/Exit'
import { Fx } from '@/Fx'
import { LocalScope } from '@/Scope'

import type { FindInstruction, Instruction } from './Instruction'
import type { InstructionProcessor } from './InstructionProcessor'
import type { GeneratorNode, InstructionTree } from './InstructionTree'

export type Processor<R, E, Type extends Instruction<any, any>['type']> = (
  instruction: FindInstruction<Type, R, E>,
  previous: GeneratorNode<R, E>,
  processor: InstructionProcessor<R, E, any>,
  run: RunInstruction,
) => Resume<R, E, any>

export type RunInstruction = <R2, E2, A>(
  instruction: Fx<R2, E2, A>,
  resources: R2,
  context: Context<E2>,
  scope: LocalScope<E2, A>,
  onExit: (exit: Exit<E2, A>) => void,
) => Disposable

export type Resume<R, E, A> =
  | ResumeSync<A>
  | ResumeAsync<A>
  | ResumeDeferred<R, E, A>
  | ResumeNode<R, E>

export class ResumeSync<A> {
  readonly type = 'Sync'
  constructor(readonly value: A) {}
}

export class ResumeAsync<A> {
  readonly type = 'Async'
  constructor(readonly run: (cb: (value: A) => void) => Disposable) {}
}

export class ResumeDeferred<R, E, A> {
  readonly type = 'Deferred'

  constructor(readonly defer: (cb: (resume: Resume<R, E, A>) => void) => Disposable) {}
}

export class ResumeNode<R, E> {
  readonly type = 'Node'

  constructor(readonly node: InstructionTree<R, E, any>) {}
}
