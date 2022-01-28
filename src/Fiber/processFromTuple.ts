import { disposeAll } from '@/Disposable'
import { FromTuple, TupleErrors, TupleResources } from '@/Effect'
import { Exit } from '@/Exit'
import { Fx } from '@/Fx'

import { InstructionProcessor } from './InstructionProcessor'
import { ResumeAsync, ResumeSync } from './RuntimeInstruction'
import { RuntimeProcessor } from './RuntimeProcessor'

export const processFromTuple = <FX extends ReadonlyArray<Fx<any, any, any> | Fx<any, never, any>>>(
  tuple: FromTuple<FX>,
  processor: InstructionProcessor<TupleResources<FX>, TupleErrors<FX>, any>,
) =>
  tuple.input.length === 0
    ? new ResumeSync([])
    : new ResumeAsync((cb) => {
        const exits: Array<Exit<any, any>> = Array(tuple.input.length)
        let remaining = tuple.input.length

        function onComplete(exit: Exit<any, any>, index: number) {
          exits[index] = exit

          if (--remaining === 0) {
            cb(exits)
          }
        }

        return disposeAll(
          tuple.input.map((fx, i) => {
            const nested = processor.extend(fx, processor.resources)

            const runtime = new RuntimeProcessor(
              nested.extend(fx, nested.resources),
              nested.captureStackTrace,
              nested.shouldTrace,
              nested.scope.interruptableStatus,
            )

            runtime.addObserver((exit) => onComplete(exit, i))
            runtime.processNow()

            return runtime
          }),
        )
      })
