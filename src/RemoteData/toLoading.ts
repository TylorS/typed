import { pipe } from 'fp-ts/function'
import { fold as foldO } from 'fp-ts/Option'

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
          foldO(() => Loading, progress),
        ),
      (value, info) =>
        pipe(
          info.progress,
          foldO(
            () => RefreshingFailure.of(value),
            (p) => RefreshingFailure.of(value, p),
          ),
        ),
      (value, info) =>
        pipe(
          info.progress,
          foldO(
            () => RefreshingSuccess.of(value),
            (p) => RefreshingSuccess.of(value, p),
          ),
        ),
    ),
  )
