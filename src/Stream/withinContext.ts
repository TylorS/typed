import { pipe } from 'fp-ts/function'

import { getRootContext } from '@/Fiber'
import { FiberContext } from '@/FiberContext'

import { chain } from './chain'
import { makeFromFxOperator } from './fromFx'
import { make, Stream } from './Stream'

/**
 * Runs a part of the stream graph within a particular Context
 */
export const withinContext =
  <E>(context: FiberContext<E>, operator = 'withinContext') =>
  <R, A>(stream: Stream<R, E, A>): Stream<R, E, A> =>
    make<R, E, A>((sink, streamContext) =>
      stream.run(sink, { ...streamContext, fiberContext: context }),
    )

const getRoot = makeFromFxOperator('withinRootContext')(getRootContext)

export const withinRootContext = <R, E, A>(stream: Stream<R, E, A>): Stream<R, E, A> =>
  pipe(
    getRoot,
    chain((context) => pipe(stream, withinContext(context, 'withinRootContext'))),
  )
