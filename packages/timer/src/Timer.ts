import { Duration } from '@fp-ts/data/Duration'
import { Clock } from '@typed/clock'
import { Disposable } from '@typed/disposable'
import { Time } from '@typed/time'

export interface Timer extends Clock {
  readonly delay: (f: (time: Time) => void, delay: Duration) => Disposable
  readonly fork: () => Timer
}
