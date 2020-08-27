import { RemoteDataStatus } from './enums'
import { RefreshingSuccess } from './RefreshingSuccess'
import { RemoteData } from './RemoteData'

export const isRefreshingSuccess = <A, B>(
  remoteData: RemoteData<A, B>,
): remoteData is RefreshingSuccess<B> => remoteData.status === RemoteDataStatus.RefreshingSuccess
