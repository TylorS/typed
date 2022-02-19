import { fromExit, of, Race, RaceErrors, RaceOutput, RaceResources, tuple } from '@/Effect'
import { Exit } from '@/Exit'
import { complete, pending, wait } from '@/Future'
import { dispose } from '@/Fx/dispose'
import { Fx } from '@/Fx/Fx'
import { pipe } from '@/Prelude/function'

import { InstructionProcessor } from './InstructionProcessor'
import { FxInstruction } from './Processor'
import { RuntimeProcessor } from './RuntimeProcessor'

export const processRace = <FX extends ReadonlyArray<Fx<any, any, any> | Fx<any, never, any>>>(
  instr: Race<FX>,
  processor: InstructionProcessor<RaceResources<FX>, RaceErrors<FX>, any>,
): FxInstruction<RaceResources<FX>, RaceErrors<FX>, RaceOutput<FX>> => ({
  type: 'Fx',
  fx: Fx(function* () {
    let deleteCount = 0
    const future = pending<unknown, never, Exit<any, any>>()

    // Run each Fx
    const runtimes = instr.input.map((fx, i) => {
      const nested = processor.extend(fx, processor.resources)
      const runtime = new RuntimeProcessor(
        nested,
        nested.fiberContext.fiberId,
        nested.captureStackTrace,
        nested.shouldTrace,
        nested.scope.interruptableStatus,
      )

      // Don't start Fx if another Sync Fx has already won
      if (future.state.get().type === 'Done') {
        return runtime
      }

      runtime.addObserver((exit) => {
        // Remove finished Fx from the list to be disposed
        // Guard is here in case runtimes has not finished being defined when a Sync Fx completes.
        if (typeof runtimes !== 'undefined') {
          runtimes.splice(i - deleteCount++, 1)
        }

        // Responde with the winner
        pipe(future, complete(of(exit, instr.trace)))
      })

      runtime.processNow()

      return runtime
    })

    // Wait for a winner
    const exit = yield* wait(future)

    // Cleanup all other Fx
    yield* tuple(runtimes.map(dispose))

    // Return the Result
    return yield* fromExit(exit, instr.trace)
  }),
})
