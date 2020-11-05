import { getSendSharedEvent } from '../events/exports'
import { withCurrentNamespace } from './withCurrentNamespace'

export const getDeleteNamesace = withCurrentNamespace(function* (namespace) {
  const sendEvent = yield* getSendSharedEvent

  return () => sendEvent({ type: 'namespace/deleted', namespace })
})
