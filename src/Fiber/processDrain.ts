import { left, match } from 'fp-ts/Either'
import { constVoid, pipe } from 'fp-ts/function'
import { isSome, none, some } from 'fp-ts/Option'

import { prettyPrint } from '@/Cause'
import { DisposableQueue, sync } from '@/Disposable'
import { Drain } from '@/Effect'
import { Exit } from '@/Exit'
import { dispose } from '@/Fx'
import { LocalScope } from '@/Scope'
import { Sink } from '@/Sink'

import { InstructionProcessor } from './InstructionProcessor'
import { ResumeSync } from './RuntimeInstruction'
import { RuntimeProcessor } from './RuntimeProcessor'

export const processDrain = <R, E, A>(
  drain: Drain<R, E, A>,
  processor: InstructionProcessor<R, E, any>,
) => {
  const inner = new DisposableQueue()
  const key = processor.scope.ensure(() => dispose(inner))

  inner.add(sync(() => isSome(key) && processor.scope.cancel(key.value)))
  inner.add(
    drain.input.run(makeDrainSink(processor, processor.scope), {
      resources: processor.resources,
      scope: processor.scope,
      fiberContext: processor.fiberContext,
      parentTrace: processor.shouldTrace ? some(processor.captureStackTrace()) : none,
    }),
  )

  return new ResumeSync(inner)
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
    error: (event) => close(left(event.cause)),
    end: constVoid,
  }
}
