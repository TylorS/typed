import { getRootContext } from '@/Fiber/getRootContext'
import { FiberContext } from '@/FiberContext'
import { pipe } from '@/Prelude/function'

import { chain } from './chain'
import { fromFx } from './fromFx'
import { make, Stream } from './Stream'

/**
 * Runs a part of the stream graph within a particular Context
 */
export const withinContext =
  <E>(context: FiberContext<E>) =>
  <R, A>(stream: Stream<R, E, A>): Stream<R, E, A> =>
    make<R, E, A>((sink, streamContext) =>
      stream.run(sink, { ...streamContext, fiberContext: context }),
    )

export const withinRootContext = <R, E, A>(stream: Stream<R, E, A>): Stream<R, E, A> =>
  pipe(
    fromFx(getRootContext<E>()),
    chain((context) => pipe(stream, withinContext(context))),
  )
