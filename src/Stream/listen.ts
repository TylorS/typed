import { Disposable } from '@/Disposable'
import { Fx } from '@/Fx'
import { pipe } from '@/Prelude/function'

import { drain } from './drain'
import { Stream } from './Stream'
import { tapFx } from './tapFx'

export const listen =
  <A, R2, E2>(f: (a: A) => Fx<R2, E2, any>) =>
  <R, E>(stream: Stream<R, E, A>): Fx<R & R2, E | E2, Disposable> =>
    pipe(stream, tapFx(f), drain)