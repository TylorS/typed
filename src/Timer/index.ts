import { Clock, Time } from '@/Clock'
import { Future } from '@/Future'

export interface Timer extends Clock {
  readonly sleep: (duration: number) => Future<never, Time>
}
