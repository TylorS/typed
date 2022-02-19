import { getScope } from '@/Effect'
import { isSome } from '@/Prelude/Option'
import { Scope } from '@/Scope'

import { Fx } from './Fx'

export const getRootScope = Fx(function* () {
  let scope: Scope<any, any> = yield* getScope('getRootScope')

  while (scope.type === 'LocalScope' && isSome(scope.parent)) {
    scope = scope.parent.value
  }

  return scope
})
