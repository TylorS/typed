import { Failure } from './Failure'
import { isFailure } from './isFailure'
import { isRefreshingFailure } from './isRefreshingFailure'
import { RefreshingFailure } from './RefreshingFailure'
import { RemoteData } from './RemoteData'

/**
 * RemoteData is Failure or RefreshingFailure
 */
export const hasFailed = <A, B>(rd: RemoteData<A, B>): rd is Failure<A> | RefreshingFailure<A> =>
  isFailure(rd) || isRefreshingFailure(rd)
