import { isLeft } from 'fp-ts/Either'
import { flow, pipe } from 'fp-ts/function'
import { none } from 'fp-ts/Option'

import * as Fx from '@/Fx'
import { tryEnd, tryEvent } from '@/Sink'

import { make, Stream } from './Stream'

export function fromFx<R, E, A>(fx: Fx.Fx<R, E, A>, operator = 'fromFx'): Stream<R, E, A> {
  return makeFromFxOperator(operator)(fx)
}

export function makeFromFxOperator(operator: string) {
  return <R, E, A>(fx: Fx.Fx<R, E, A>): Stream<R, E, A> => {
    return make((resources, sink, context, scope) =>
      context.scheduler.asap(
        Fx.Fx(function* () {
          const exit = yield* Fx.result(fx)
          const time = context.scheduler.getCurrentTime()

          if (isLeft(exit)) {
            return sink.error({
              type: 'Error',
              operator,
              time,
              cause: exit.left,
              fiberId: context.fiberId,
            })
          }

          tryEvent(sink, {
            type: 'Event',
            operator,
            time,
            value: exit.right,
            trace: none,
            fiberId: context.fiberId,
          })

          tryEnd(sink, { type: 'End', operator, time, trace: none, fiberId: context.fiberId })
        }),
        resources,
        context,
        scope,
      ),
    )
  }
}

export const accessFx = flow(Fx.access, makeFromFxOperator('accessFx'))
export const ask = flow(Fx.ask, makeFromFxOperator('ask'))
export const asks = flow(Fx.asks, makeFromFxOperator('asks'))
export const disposed = flow(Fx.disposed, makeFromFxOperator('disposed'))
export const ensureDisposable = flow(Fx.ensureDisposable, makeFromFxOperator('ensureDisposable'))
export const fail = flow(Fx.fail, makeFromFxOperator('fail'))
export const fromAsync = flow(Fx.fromAsync, makeFromFxOperator('fromAsync'))
export const fromCause = flow(Fx.fromCause, makeFromFxOperator('fromCause'))
export const fromEither = flow(Fx.fromEither, makeFromFxOperator('fromEither'))
export const fromExit = flow(Fx.fromExit, makeFromFxOperator('fromExit'))
export const fromIO = flow(Fx.fromIO, makeFromFxOperator('fromIO'))
export const of = flow(Fx.of, makeFromFxOperator('of'))
export const suspend = makeFromFxOperator('suspend')(Fx.of(undefined))
export const unexpected = flow(Fx.unexpected, makeFromFxOperator('unexpected'))
export const never = pipe(Fx.never, makeFromFxOperator('never'))
