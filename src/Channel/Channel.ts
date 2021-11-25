import { Fx } from '@/Fx'
import { Stream } from '@/Stream/Stream'

export interface Channel<R, E, I, O> {
  readonly send: (input: I) => Fx<R, E, void>
  readonly output: Stream<R, E, O>
}
