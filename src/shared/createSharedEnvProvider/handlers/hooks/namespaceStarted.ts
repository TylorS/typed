import { NamespaceStarted } from '@typed/fp/Shared/core/events/exports'
import { usingNamespace } from '@typed/fp/Shared/core/exports'
import { resetPosition } from '@typed/fp/Shared/hooks/exports'
import { pipe } from 'fp-ts/function'

export function namespaceStarted({ namespace }: NamespaceStarted) {
  return pipe(resetPosition, usingNamespace(namespace))
}
