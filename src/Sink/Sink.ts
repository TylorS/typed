import { Cause, Unexpected } from '@/Cause'
import { Time } from '@/Clock'

export interface Sink<E, A> {
  readonly event: (time: Time, value: A) => void
  readonly error: (time: Time, cause: Cause<E>) => void
  readonly end: (time: Time) => void
}

export function tryEvent<E, A>(sink: Sink<E, A>, time: Time, value: A) {
  try {
    sink.event(time, value)
  } catch (e) {
    sink.error(time, Unexpected(e))
  }
}

export function tryEnd<E, A>(sink: Sink<E, A>, time: Time) {
  try {
    sink.end(time)
  } catch (e) {
    sink.error(time, Unexpected(e))
  }
}
