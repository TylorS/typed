import { disposeAll } from '@/Disposable'
import { FromTuple, TupleErrors, TupleResources } from '@/Effect'
import { Exit } from '@/Exit'
import { Fx } from '@/Fx'

import { InstructionProcessor } from './InstructionProcessor'
import { ResumeAsync } from './RuntimeInstruction'
import { RuntimeProcessor } from './RuntimeProcessor'

export const processFromTuple = <FX extends ReadonlyArray<Fx<any, any, any> | Fx<any, never, any>>>(
  tuple: FromTuple<FX>,
  processor: InstructionProcessor<TupleResources<FX>, TupleErrors<FX>, any>,
) =>
  new ResumeAsync((cb) => {
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
        const runtime = new RuntimeProcessor(
          processor.extend(fx, processor.resources),
          processor.captureStackTrace,
          processor.shouldTrace,
        )

        runtime.addObserver((exit) => onComplete(exit, i))
        runtime.processNow()

        return runtime
      }),
    )
  })
