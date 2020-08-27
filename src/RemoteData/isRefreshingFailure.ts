import { RemoteDataStatus } from './enums'
import { RefreshingFailure } from './RefreshingFailure'
import { RemoteData } from './RemoteData'

export const isRefreshingFailure = <A, B>(
  remoteData: RemoteData<A, B>,
): remoteData is RefreshingFailure<A> => remoteData.status === RemoteDataStatus.RefreshingFailure
