import { curry } from '@typed/fp/lambda'

import { isRefreshingSuccess } from './isRefreshingSuccess'
import { isSuccess } from './isSuccess'
import { RefreshingSuccess } from './RefreshingSuccess'
import { RemoteData } from './RemoteData'
import { Success } from './Success'

/**
 * Map over the value of a successful RemoteData.
 * @name map<A, B, C>(f: (value: B, refreshing: boolean) => C,, data: RemoteData<A, B>): RemoteData<A, C>
 */
export const map = curry(__map) as {
  <A, B, C>(f: (value: B, refreshing: boolean) => C, data: RemoteData<A, B>): RemoteData<A, C>
  <A, B, C>(f: (value: B, refreshing: boolean) => C): (data: RemoteData<A, B>) => RemoteData<A, C>
}

function __map<A, B, C>(
  f: (value: B, refreshing: boolean) => C,
  data: RemoteData<A, B>,
): RemoteData<A, C> {
  if (isRefreshingSuccess(data)) {
    return RefreshingSuccess.of(f(data.value, true))
  }

  return isSuccess(data) ? Success.of(f(data.value, false)) : data
}
