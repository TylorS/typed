import { RemoteDataStatus } from './enums'
import { Loading, RemoteData } from './RemoteData'

export const isLoading = <A, B>(remoteData: RemoteData<A, B>): remoteData is Loading =>
  remoteData.status === RemoteDataStatus.Loading
