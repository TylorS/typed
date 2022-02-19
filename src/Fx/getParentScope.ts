import { getScope } from '@/Effect'

import { Fx } from './Fx'

export const getParentScope = Fx(function* () {
  const scope = yield* getScope('getParentScope')

  return scope.parent
})
