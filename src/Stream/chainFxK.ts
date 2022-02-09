import { Fx } from '@/Fx'
import { pipe } from '@/Prelude/function'

import { chain } from './chain'
import { fromFx } from './fromFx'
import { Stream } from './Stream'

export const chainFxK =
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>) =>
  <R, E>(stream: Stream<R, E, A>): Stream<R & R2, E | E2, B> =>
    pipe(
      stream,
      chain((a) => pipe(a, f, fromFx)),
    )
