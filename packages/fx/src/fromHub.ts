import * as Effect from '@effect/io/Effect'
import * as Hub from '@effect/io/Hub'
import * as Scope from '@effect/io/Scope'

import { Fx } from './Fx.js'
import { fromDequeueWithShutdown } from './fromDequeue.js'

export function fromHub<A>(hub: Hub.Hub<A>): Fx<Scope.Scope, never, A> {
  return Fx((sink) => Effect.flatMap(hub.subscribe(), (q) => fromDequeueWithShutdown(q).run(sink)))
}
