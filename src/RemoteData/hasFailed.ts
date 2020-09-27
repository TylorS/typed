import { RemoteData } from './exports'
import { Failure } from './Failure'
import { isFailure } from './isFailure'
import { isRefreshingFailure } from './isRefreshingFailure'
import { RefreshingFailure } from './RefreshingFailure'

export const hasFailed = <A, B>(rd: RemoteData<A, B>): rd is Failure<A> | RefreshingFailure<A> =>
  isFailure(rd) || isRefreshingFailure(rd)
