import { doEffect } from '@typed/fp/Effect/exports'
import { addToTree } from '@typed/fp/Shared/context/exports'
import { NamespaceStarted } from '@typed/fp/Shared/core/events/exports'
import { usingNamespace } from '@typed/fp/Shared/core/exports'
import { pipe } from 'fp-ts/function'

export function namespaceStarted({ parent, namespace }: NamespaceStarted) {
  const eff = doEffect(function* () {
    // Add to the NamespaceTree to power Context API
    yield* addToTree(parent)
  })

  return pipe(eff, usingNamespace(namespace))
}
