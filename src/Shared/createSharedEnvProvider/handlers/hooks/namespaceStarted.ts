import { NamespaceStarted } from '@fp/Shared/core/events/exports'
import { usingNamespace } from '@fp/Shared/core/exports'
import { resetPosition } from '@fp/Shared/hooks/exports'
import { pipe } from 'fp-ts/function'

export function namespaceStarted({ namespace }: NamespaceStarted) {
  return pipe(resetPosition, usingNamespace(namespace))
}
