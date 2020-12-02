import { RemoteDataStatus } from './enums'
import { RefreshingSuccess } from './RefreshingSuccess'
import { RemoteData } from './RemoteData'

/**
 * Check if a RemoteData value is RefreshingSuccess
 */
export const isRefreshingSuccess = <A, B>(
  remoteData: RemoteData<A, B>,
): remoteData is RefreshingSuccess<B> => remoteData.status === RemoteDataStatus.RefreshingSuccess
