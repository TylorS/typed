import { Duration } from '@fp-ts/data/Duration'
import { Clock } from '@typed/clock'
import { Disposable } from '@typed/disposable'

export interface Timer extends Clock {
  readonly delay: (callback: () => void, delay: Duration) => Disposable
  readonly fork: () => Timer
}
