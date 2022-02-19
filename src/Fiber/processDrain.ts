import { Disposable, DisposableQueue, Sync } from '@/Disposable'
import { Drain } from '@/Effect'
import { Exit } from '@/Exit'
import { dispose } from '@/Fx/dispose'
import { Fx } from '@/Fx/Fx'
import { prettyPrint } from '@/Prelude/Cause'
import { Left, match } from '@/Prelude/Either'
import { constVoid, pipe } from '@/Prelude/function'
import { isSome, None, Some } from '@/Prelude/Option'
import { LocalScope } from '@/Scope'
import { Sink } from '@/Sink'

import { InstructionProcessor } from './InstructionProcessor'
import { DeferredInstruction } from './Processor'
import { ResumeSync } from './RuntimeInstruction'
import { RuntimeProcessor } from './RuntimeProcessor'

export const processDrain = <R, E, A>(
  drain: Drain<R, E, A>,
  processor: InstructionProcessor<R, E, any>,
) => {
  return new DeferredInstruction<R, E, Disposable>(
    Fx(function* () {
      const inner = new DisposableQueue()
      const key = yield* processor.scope.ensure(() => dispose(inner))

      inner.add(Sync(() => isSome(key) && processor.scope.cancel(key.value)))

      inner.add(
        drain.input.run(makeDrainSink(processor, processor.scope), {
          resources: processor.resources,
          scope: processor.scope,
          fiberContext: processor.fiberContext,
          parentTrace: processor.shouldTrace ? Some(processor.captureStackTrace()) : None,
        }),
      )

      return new ResumeSync(inner)
    }),
  )
}

function makeDrainSink<R, E, A>(
  processor: InstructionProcessor<R, E, any>,
  scope: LocalScope<E, any>,
): Sink<E, A> {
  const close = (exit: Exit<E, any>) =>
    processor.trackDisposable((remove) => {
      const fx = scope.close(exit)
      const nested = processor.extend(fx, processor.resources)
      const runtime = new RuntimeProcessor(
        nested,
        nested.fiberContext.fiberId,
        nested.captureStackTrace,
        nested.shouldTrace,
        nested.scope.interruptableStatus,
      )

      runtime.addObserver((exit) => {
        pipe(
          exit,
          match(
            (cause) => console.error(prettyPrint(cause, processor.fiberContext.renderer)),
            constVoid,
          ),
        )

        remove()
      })

      runtime.processNow()

      return runtime
    })

  return {
    event: constVoid,
    error: (event) => close(Left(event.cause)),
    end: constVoid,
  }
}
