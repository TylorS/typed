import { pipe } from 'fp-ts/function'

import { Context } from '@/Context'
import { getRootContext } from '@/Fiber'

import { chain } from './chain'
import { fromFx } from './fromFx'
import { addOperator, make, Stream } from './Stream'

/**
 * Runs a part of the stream graph within a particular Context
 */
export const withinContext =
  <E>(context: Context<E>) =>
  <R, A>(stream: Stream<R, E, A>): Stream<R, E, A> =>
    make<R, E, A>((resources, sink, _, scope, tracer) =>
      stream.run(resources, sink, context, scope, pipe(tracer, addOperator('withinContext'))),
    )

export const withinRootContext = <R, E, A>(stream: Stream<R, E, A>): Stream<R, E, A> =>
  pipe(
    getRootContext,
    fromFx,
    chain((context) => pipe(stream, withinContext(context))),
  )
