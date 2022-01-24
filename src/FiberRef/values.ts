import { Option } from 'fp-ts/Option'

import { make, Stream } from '@/Stream'

import { FiberRef } from './FiberRef'

export const values = <R, E, A>(fiberRef: FiberRef<R, E, A>): Stream<R, never, Option<A>> =>
  make((resources, sink, context, scope, tracer) =>
    context.locals.values(fiberRef).run(resources, sink, context, scope, tracer),
  )
