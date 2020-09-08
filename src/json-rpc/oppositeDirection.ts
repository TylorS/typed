import { MessageDirection } from './MessageDirection'

export const oppositeDirection = (direction: MessageDirection): MessageDirection =>
  direction === MessageDirection.Incoming ? MessageDirection.Outgoing : MessageDirection.Incoming
