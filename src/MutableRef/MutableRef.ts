import { Fx } from '@/Fx'

export interface MutableRef<R, E, A> {
  readonly get: () => Fx<R, E, A>
  readonly set: (value: A) => Fx<R, E, void>
}
