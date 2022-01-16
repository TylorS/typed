import { IO } from 'fp-ts/IO'

export interface Clock {
  readonly getCurrentTime: IO<number>
}

export const DateClock: Clock = {
  getCurrentTime: Date.now,
}
