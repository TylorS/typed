import { doEffect } from '@typed/fp/Effect/exports'
import { NamespaceStarted, usingNamespace } from '@typed/fp/Shared/domain/exports'
import { pipe } from 'fp-ts/function'

import { addToTree } from '../context/exports'
import { resetPosition } from '../hooks/exports'

export function respondToNamespaceStarted({ parent, namespace }: NamespaceStarted) {
  const eff = doEffect(function* () {
    yield* addToTree(parent)
    yield* resetPosition
  })

  return pipe(eff, usingNamespace(namespace))
}
