import { createSchema } from '@typed/fp/io/exports'

import { NamespaceEvent } from './NamespaceEvent'
import { SharedValueEvent } from './SharedValueEvent'

export type SharedEvent = NamespaceEvent | SharedValueEvent

export namespace SharedEvent {
  export const schema = createSchema<SharedEvent>((t) =>
    t.union(NamespaceEvent.schema(t), SharedValueEvent.schema(t)),
  )
}
