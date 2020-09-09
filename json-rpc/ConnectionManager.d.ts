import { Subject } from 'most-subject'

import { Connection } from './Connection'
import { ConnectionEvent } from './ConnectionEvent'
export interface ConnectionManager {
  readonly connections: ReadonlyArray<Connection>
  readonly connectionEvents: Subject<ConnectionEvent, ConnectionEvent>
}
//# sourceMappingURL=ConnectionManager.d.ts.map
