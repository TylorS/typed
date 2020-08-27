import { RemoteDataStatus } from './enums'
import { Refreshing, RemoteData } from './RemoteData'

export const isRefreshing = <A, B>(remoteData: RemoteData<A, B>): remoteData is Refreshing<A, B> =>
  remoteData.status === RemoteDataStatus.RefreshingFailure ||
  remoteData.status === RemoteDataStatus.RefreshingSuccess
