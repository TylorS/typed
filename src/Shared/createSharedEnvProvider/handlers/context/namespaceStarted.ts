import { addToTree } from '@typed/fp/Shared/context/exports'
import { NamespaceStarted } from '@typed/fp/Shared/core/events/exports'
import { usingNamespace } from '@typed/fp/Shared/core/exports'
import { pipe } from 'fp-ts/function'

export function namespaceStarted({ parent, namespace }: NamespaceStarted) {
  return pipe(addToTree(parent), usingNamespace(namespace))
}
