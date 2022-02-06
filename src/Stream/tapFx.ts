import { pipe } from '@/function'
import { Fx } from '@/Fx'

import { chain } from './chain'
import { fromFx } from './fromFx'
import { map } from './map'
import { Stream } from './Stream'

export const tapFx =
  <A, R2, E2>(f: (a: A) => Fx<R2, E2, any>) =>
  <R, E>(stream: Stream<R, E, A>): Stream<R & R2, E | E2, A> =>
    pipe(
      stream,
      chain((a) =>
        pipe(
          a,
          f,
          fromFx,
          map(() => a),
        ),
      ),
    )
