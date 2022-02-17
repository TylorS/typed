import deepEquals from 'fast-deep-equal'

import { Eq } from './Eq'

export const DeepEquals: Eq<unknown> = {
  equals: (second) => (first) => deepEquals(first, second),
}
