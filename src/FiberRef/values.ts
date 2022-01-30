import { Option } from 'fp-ts/Option'

import { make, Stream } from '@/Stream'

import { FiberRef } from './FiberRef'

export const values = <R, E, A>(fiberRef: FiberRef<R, E, A>): Stream<unknown, never, Option<A>> =>
  make((sink, context) => context.fiberContext.locals.values(fiberRef).run(sink, context))
