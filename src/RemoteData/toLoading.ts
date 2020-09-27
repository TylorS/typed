import { pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'

import { fold } from './fold'
import { RefreshingFailure } from './RefreshingFailure'
import { RefreshingSuccess } from './RefreshingSuccess'
import { Loading, progress, RemoteData } from './RemoteData'

export const toLoading = <A, B>(
  rd: RemoteData<A, B>,
): Loading | RefreshingFailure<A> | RefreshingSuccess<B> =>
  pipe(
    rd,
    fold(
      () => Loading,
      (p) =>
        pipe(
          p,
          O.fold(() => Loading, progress),
        ),
      (value, info) =>
        pipe(
          info.progress,
          O.fold(
            () => RefreshingFailure.of(value),
            (p) => RefreshingFailure.of(value, p),
          ),
        ),
      (value, info) =>
        pipe(
          info.progress,
          O.fold(
            () => RefreshingSuccess.of(value),
            (p) => RefreshingSuccess.of(value, p),
          ),
        ),
    ),
  )
