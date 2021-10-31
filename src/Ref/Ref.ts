import { Option } from 'fp-ts/Option'

import { Fx } from '@/Fx'
import { Stream } from '@/Stream'

export interface Ref<R, I, O> {
  readonly get: Fx<R, O>
  readonly set: (i: I) => Fx<R, O>
  readonly delete: Fx<R, Option<O>>
  readonly values: Stream<R, Option<O>>
}
