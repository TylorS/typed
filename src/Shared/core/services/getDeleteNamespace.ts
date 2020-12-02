import { getSendSharedEvent } from '../events/exports'
import { withCurrentNamespace } from './withCurrentNamespace'

/**
 * Get access to an IO that will delete the current namespace. Useful for
 * hooking into other system's lifecycle events.
 */
export const getDeleteNamesace = withCurrentNamespace(function* (namespace) {
  const sendEvent = yield* getSendSharedEvent

  return () => sendEvent({ type: 'namespace/deleted', namespace })
})
