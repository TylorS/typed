import { disposeAll } from '@/Disposable'
import { Effect } from '@/Effect'
import { FromTuple, TupleErrors, TupleOutput } from '@/Effect/FromTuple'
import { both, Exit } from '@/Exit'
import { extendScope } from '@/Scope'

import { Instruction } from './Instruction'
import { InstructionProcessor } from './InstructionProcessor'
import { GeneratorNode } from './InstructionTree'
import { ResumeAsync, ResumeSync, RunInstruction } from './Processor'

export const processFromTuple = <
  Effects extends ReadonlyArray<Effect<any, any, any> | Effect<any, never, any>>,
  R,
  E,
>(
  instruction: FromTuple<Effects>,
  _previous: GeneratorNode<R, E>,
  runtime: InstructionProcessor<any, any, any>,
  run: RunInstruction,
) =>
  instruction.input.length === 0
    ? new ResumeSync([])
    : new ResumeAsync<Exit<TupleErrors<Effects>, TupleOutput<Effects>>>((cb) => {
        const exits: Array<Exit<any, any>> = Array(instruction.input.length)
        let remaining = instruction.input.length

        function onComplete(exit: Exit<any, any>, idx: number) {
          exits[idx] = exit

          if (--remaining === 0) {
            const [first, ...rest] = exits
            const exit = rest.reduce(both, first)

            cb(exit)
          }
        }

        return disposeAll(
          instruction.input.map((instr, idx) =>
            run(
              instr as Instruction<R, E>,
              runtime.resources,
              runtime.context,
              extendScope(runtime.scope),
              (exit) => onComplete(exit, idx),
            ),
          ),
        )
      })
