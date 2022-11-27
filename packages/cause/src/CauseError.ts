import { Cause } from './Cause.js'

export class CauseError<E> extends Error {
  constructor(readonly causedBy: Cause<E>) {
    // TODO: Handle printing of cause
    super(`TODO: CauseError`)
  }
}
