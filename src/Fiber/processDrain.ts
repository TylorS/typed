import { left, match } from 'fp-ts/Either'
import { constVoid, pipe } from 'fp-ts/function'
import { isSome, some } from 'fp-ts/Option'

import { prettyPrint } from '@/Cause'
import { DisposableQueue, dispose, sync } from '@/Disposable'
import { Drain, fromPromise } from '@/Effect'
import { Exit, success } from '@/Exit'
import { extendScope, LocalScope } from '@/Scope'
import { Sink } from '@/Sink'
import { makeTracer } from '@/Stream'

import { InstructionProcessor } from './InstructionProcessor'
import { ResumeSync } from './RuntimeInstruction'
import { RuntimeProcessor } from './RuntimeProcessor'

export const processDrain = <R, E, A>(
  drain: Drain<R, E, A>,
  processor: InstructionProcessor<R, E, any>,
) => {
  const inner = new DisposableQueue()
  const key = processor.scope.ensure(() => fromPromise(async () => dispose(inner)))
  const scope = extendScope(processor.scope)

  inner.add(sync(() => isSome(key) && processor.scope.cancel(key.value)))

  inner.add(
    drain.input.run(
      processor.resources,
      makeDrainSink(processor, scope),
      processor.context,
      scope,
      makeTracer(
        processor.context,
        processor.shouldTrace,
        processor.shouldTrace ? some(processor.captureStackTrace()) : processor.parentTrace,
      ),
    ),
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
        processor.captureStackTrace,
        processor.shouldTrace,
        scope.interruptableStatus,
      )

      runtime.addObserver((exit) => {
        pipe(
          exit,
          match(
            (cause) => console.error(prettyPrint(cause, processor.context.renderer)),
            constVoid,
          ),
        )

        remove()
      })

      runtime.processLater()

      return runtime
    })

  return {
    event: constVoid,
    error: (event) => close(left(event.cause)),
    end: () => close(success(void 0)),
  }
}
