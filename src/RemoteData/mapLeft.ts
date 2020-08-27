import { curry } from '@typed/fp/lambda'
import { none } from 'fp-ts/es6/Option'

import { Failure } from './Failure'
import { FailureInfo } from './fold'
import { isFailure } from './isFailure'
import { isRefreshingFailure } from './isRefreshingFailure'
import { RefreshingFailure } from './RefreshingFailure'
import { RemoteData } from './RemoteData'

export const mapLeft = curry(
  <A, B, C>(f: (value: A, info: FailureInfo) => B, rd: RemoteData<A, C>): RemoteData<B, C> => {
    if (isRefreshingFailure(rd)) {
      return RefreshingFailure.of(f(rd.value, { refreshing: true, progress: rd.progress }))
    }

    if (isFailure(rd)) {
      return Failure.of(f(rd.value, { refreshing: false, progress: none }))
    }

    return rd
  },
) as {
  <A, B, C>(f: (value: A, info: FailureInfo) => B, rd: RemoteData<A, C>): RemoteData<B, C>
  <A, B>(f: (value: A, info: FailureInfo) => B): <C>(rd: RemoteData<A, C>) => RemoteData<B, C>
}
