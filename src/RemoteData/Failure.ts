import { RemoteDataStatus } from './enums'

/**
 * The Failure case of a RemoteData
 */
export interface Failure<A> {
  readonly status: RemoteDataStatus.Failure
  readonly value: A
}

export namespace Failure {
  /**
   * Create a Failure containing a specific value.
   */
  export const of = <A>(value: A): Failure<A> => ({ status: RemoteDataStatus.Failure, value })
}
