import { Connection } from './Connection'

export type ConnectionEvent = AddConnectionEvent | RemoveConnectionEvent

export interface AddConnectionEvent {
  readonly type: 'add'
  readonly connection: Connection
}

export interface RemoveConnectionEvent {
  readonly type: 'remove'
  readonly connection: Connection
}
