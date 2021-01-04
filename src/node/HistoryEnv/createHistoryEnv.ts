import { HistoryEnv } from '@fp/history/HistoryEnv'
import { Uri } from '@fp/Uri/exports'

import { ServerHistory } from './ServerHistory'
import { ServerLocation } from './ServerLocation'

/**
 * Create A History Environment that works in-memory.
 */
export function createHistoryEnv(uri: Uri = Uri.wrap('/')): HistoryEnv {
  const serverLocation = new ServerLocation(uri)
  const serverHistory = new ServerHistory(serverLocation)
  serverLocation.setHistory(serverHistory)

  return {
    location: serverLocation,
    history: serverHistory,
  }
}
