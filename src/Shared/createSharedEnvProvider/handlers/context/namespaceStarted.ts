import { addToTree } from '@fp/Shared/context/exports'
import { NamespaceStarted } from '@fp/Shared/core/events/exports'
import { usingNamespace } from '@fp/Shared/core/exports'
import { pipe } from 'fp-ts/function'

export function namespaceStarted({ parent, namespace }: NamespaceStarted) {
  return pipe(addToTree(parent), usingNamespace(namespace))
}
