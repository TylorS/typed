import { curry } from '@typed/fp/lambda/exports'
import { none } from 'fp-ts/Option'

import { SuccessInfo } from './fold'
import { isRefreshingSuccess } from './isRefreshingSuccess'
import { isSuccess } from './isSuccess'
import { RemoteData } from './RemoteData'

/**
 * Returns a `RemoteData` that is the result of calling `f` with the resolved
 * value of another `RemoteData`.
 * @name chain<A, B, C>(f: (value: B, refreshing: boolean) => RemoteData<A, C>, data: RemoteData<A, B>): RemoteData<A C>
 */
export const chain = curry(__chain) as {
  <A, B, C>(
    f: (value: B, info: SuccessInfo) => RemoteData<A, C>,
    data: RemoteData<A, B>,
  ): RemoteData<A, C>
  <A, B, C>(f: (value: B, info: SuccessInfo) => RemoteData<A, C>): (
    data: RemoteData<A, B>,
  ) => RemoteData<A, C>
}

function __chain<A, B, C>(
  f: (value: B, info: SuccessInfo) => RemoteData<A, C>,
  data: RemoteData<A, B>,
): RemoteData<A, C> {
  if (isRefreshingSuccess(data)) {
    return f(data.value, { refreshing: true, progress: data.progress })
  }

  return isSuccess(data) ? f(data.value, { refreshing: false, progress: none }) : data
}
