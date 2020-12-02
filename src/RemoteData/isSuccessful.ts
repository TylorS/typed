import { isRefreshingSuccess } from './isRefreshingSuccess'
import { isSuccess } from './isSuccess'
import { RefreshingSuccess } from './RefreshingSuccess'
import { RemoteData } from './RemoteData'
import { Success } from './Success'

/**
 * Check if RemoteData is Success or RefreshingSuccess
 */
export const isSuccessful = <A, B>(rd: RemoteData<A, B>): rd is Success<B> | RefreshingSuccess<B> =>
  isSuccess(rd) || isRefreshingSuccess(rd)
