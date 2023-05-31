import * as Effect from '@effect/io/Effect'
import * as S from '@effect/stream/Stream'

import { Fx } from './Fx.js'

export function fromStream<R, E, A>(stream: S.Stream<R, E, A>): Fx<R, E, A> {
  return Fx((sink) => Effect.catchAllCause(S.runForEach(stream, sink.event), sink.error))
}
