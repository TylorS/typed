import { pipe } from 'fp-ts/function'
import { ReaderTask } from 'fp-ts/ReaderTask'

import { Effect } from './Effect'
import { provideSome } from './provide'
import { toTask } from './toPromise'

export const toReaderTask = <E, A>(effect: Effect<E, A>): ReaderTask<E, A> => (e) =>
  pipe(effect, provideSome(e), toTask)
