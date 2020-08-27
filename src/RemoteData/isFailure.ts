import { RemoteDataStatus } from './enums'
import { Failure } from './Failure'
import { RemoteData } from './RemoteData'

export const isFailure = <A, B>(remoteData: RemoteData<A, B>): remoteData is Failure<A> =>
  remoteData.status === RemoteDataStatus.Failure
