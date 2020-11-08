import { NamespaceStarted } from '@typed/fp/shared/core/events/exports'
import { usingNamespace } from '@typed/fp/shared/core/exports'
import { resetPosition } from '@typed/fp/shared/hooks/exports'
import { pipe } from 'fp-ts/function'

export function namespaceStarted({ namespace }: NamespaceStarted) {
  return pipe(resetPosition, usingNamespace(namespace))
}
