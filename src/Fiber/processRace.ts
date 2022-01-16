import { isLeft, isRight, left } from 'fp-ts/Either'

import { Both, Cause, Then, Unexpected } from '@/Cause'
import { dispose, disposeAll } from '@/Disposable'
import { Effect } from '@/Effect'
import { Race } from '@/Effect/Race'
import { Exit } from '@/Exit'
import { extendScope } from '@/Scope'

import { Instruction } from './Instruction'
import { InstructionProcessor } from './InstructionProcessor'
import { GeneratorNode } from './InstructionTree'
import { ResumeDeferred, ResumeNode, ResumeSync, RunInstruction } from './Processor'

export const processRace = <
  Effects extends ReadonlyArray<Effect<any, any, any> | Effect<any, never, any>>,
  R,
  E,
>(
  instruction: Race<Effects>,
  _previous: GeneratorNode<R, E>,
  runtime: InstructionProcessor<any, any, any>,
  run: RunInstruction,
) =>
  instruction.input.length === 0
    ? new ResumeSync([])
    : new ResumeDeferred((cb) => {
        const causes: Array<Cause<any>> = Array(instruction.input.length)

        let remaining = instruction.input.length
        let deleted = 0

        const disposables = instruction.input.map((instr, idx) =>
          run(
            instr as Instruction<R, E>,
            runtime.resources,
            runtime.context,
            extendScope(runtime.scope),
            (exit) => onComplete(exit, idx),
          ),
        )

        function onComplete(exit: Exit<any, any>, idx: number) {
          if (isLeft(exit)) {
            causes.push(exit.left)
          }

          disposables.slice(idx - deleted)
          deleted++
          remaining--

          if (isRight(exit)) {
            return onSuccess(exit.right)
          }

          if (remaining === 0) {
            const exit = left(causes.reduce(Both))

            cb(new ResumeNode({ type: 'Exit', exit }))
          }
        }

        async function onSuccess(value: any) {
          try {
            await dispose(disposeAll(disposables))

            cb(new ResumeSync(value))
          } catch (e) {
            const cause = causes.length > 0 ? causes.reduce(Then, Unexpected(e)) : Unexpected(e)

            cb(new ResumeNode({ type: 'Exit', exit: left(cause) }))
          }
        }

        return disposeAll(disposables)
      })
