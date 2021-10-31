import { constant, constVoid } from 'fp-ts/function'

import { Stream } from '../Stream'

export const never: Stream<unknown, never> = {
  run: constant({ dispose: constVoid }),
}
