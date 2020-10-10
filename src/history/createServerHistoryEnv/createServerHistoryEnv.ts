import { HistoryEnv } from '@typed/fp/history/HistoryEnv'
import { Uri } from '@typed/fp/Uri/exports'

import { ServerHistory } from './ServerHistory'
import { ServerLocation } from './ServerLocation'

/**
 * Create A History Environment that works in browser and non-browser environments
 */
export function createServerHistoryEnv<A>(uri: Uri = Uri.wrap('/')): HistoryEnv<A> {
  const serverLocation = new ServerLocation(uri)
  const serverHistory = new ServerHistory(serverLocation)
  serverLocation.setHistory(serverHistory)

  return {
    location: serverLocation,
    history: serverHistory,
  }
}
