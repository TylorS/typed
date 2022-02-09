import { Async } from '@/Async'
import { disposeAll } from '@/Disposable'
import { fromAsync, fromExit, FromTuple, TupleErrors, TupleResources } from '@/Effect'
import { both, Exit } from '@/Exit'
import { Fx } from '@/Fx'
import { isLeft, Right } from '@/Prelude/Either'

import { InstructionProcessor } from './InstructionProcessor'
import { FxInstruction } from './Processor'
import { ResumeSync } from './RuntimeInstruction'
import { RuntimeProcessor } from './RuntimeProcessor'

export const processFromTuple = <FX extends ReadonlyArray<Fx<any, any, any> | Fx<any, never, any>>>(
  tuple: FromTuple<FX>,
  processor: InstructionProcessor<TupleResources<FX>, TupleErrors<FX>, any>,
) =>
  tuple.input.length === 0
    ? new ResumeSync([])
    : new FxInstruction(
        Fx(function* () {
          const exit = yield* fromAsync(
            Async<Exit<any, any>>((cb) => {
              const exits: Array<Exit<any, any>> = Array(tuple.input.length)
              let remaining = tuple.input.length

              function onComplete(exit: Exit<any, any>, index: number) {
                exits[index] = exit

                if (--remaining === 0) {
                  const exit = exits.some(isLeft)
                    ? exits.reduce(both)
                    : Right(exits.map((x) => (x as Right<any>).value))

                  cb(exit)
                }
              }

              return disposeAll(
                tuple.input.map((fx, i) => {
                  const nested = processor.extend(fx, processor.resources)

                  const runtime = new RuntimeProcessor(
                    nested,
                    nested.fiberContext.fiberId,
                    nested.captureStackTrace,
                    nested.shouldTrace,
                    nested.scope.interruptableStatus,
                  )

                  runtime.addObserver((exit) => onComplete(exit, i))
                  runtime.processLater()

                  return runtime
                }),
              )
            }),
          )

          return yield* fromExit(exit)
        }),
      )
