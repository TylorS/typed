import { RemoteDataStatus } from './enums'

/**
 * Success state for RemoteData
 */
export interface Success<A> {
  readonly status: RemoteDataStatus.Success
  readonly value: A
}

export namespace Success {
  export const of = <A>(value: A): Success<A> => ({ status: RemoteDataStatus.Success, value })
}
