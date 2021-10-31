import { Of } from '@/Fx'

export type Fail<Key extends PropertyKey, E> = {
  readonly [K in Key]: (e: E) => Of<never>
}
