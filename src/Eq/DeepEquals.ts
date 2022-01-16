import deepEquals from 'fast-deep-equal'
import { Eq } from 'fp-ts/Eq'

export const DeepEquals: Eq<unknown> = {
  equals: (second) => (first) => deepEquals(first, second),
}
