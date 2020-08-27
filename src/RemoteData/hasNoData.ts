import { RemoteDataStatus } from './enums'
import { NoData, RemoteData } from './RemoteData'

export const hasNoData = <A, B>(remoteData: RemoteData<A, B>): remoteData is NoData =>
  remoteData.status === RemoteDataStatus.NoData
