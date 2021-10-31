import { left, right } from 'fp-ts/Either'
import { constant, pipe } from 'fp-ts/function'

import { Unexpected } from '@/Cause'
import { Disposable, settable } from '@/Disposable'
import { fromPromise, fromValue } from '@/Fiber/Instruction'
import { Fx } from '@/Fx'
import * as Scope from '@/Scope'

import { RunParams, Sink, Stream } from './Stream'

export function drain<R>(params: RunParams<R> & { readonly disposable?: Disposable }) {
  return <A>(stream: Stream<R, A>): Disposable => {
    const disposable = settable()

    if (params.disposable != null) {
      disposable.add(params.disposable)
    }

    disposable.add(stream.run(drainSink(params, disposable), params))

    return disposable
  }
}

const constVoidFx = constant(fromValue(undefined))

const drainSink = <R>(params: RunParams<R>, d: Disposable): Sink<any> => ({
  event: constVoidFx,
  error: (error) =>
    Fx(function* () {
      yield* fromPromise(async () => await d.dispose())

      const { open } = Scope.checkStatus(params.scope)

      if (open) {
        yield* pipe(params.scope, Scope.close(left(Unexpected(error))))
      }
    }),
  end: Fx(function* () {
    yield* fromPromise(async () => await d.dispose())

    const { open } = Scope.checkStatus(params.scope)

    if (open) {
      yield* pipe(params.scope, Scope.close(right<void>(undefined)))
    }
  }),
})
