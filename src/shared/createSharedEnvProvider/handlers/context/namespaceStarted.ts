import { addToTree } from '@typed/fp/shared/context/exports'
import { NamespaceStarted } from '@typed/fp/shared/core/events/exports'
import { usingNamespace } from '@typed/fp/shared/core/exports'
import { pipe } from 'fp-ts/function'

export function namespaceStarted({ parent, namespace }: NamespaceStarted) {
  return pipe(addToTree(parent), usingNamespace(namespace))
}
