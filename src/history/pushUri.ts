import { fromEnv } from '@fp/Effect/exports'
import { async } from '@fp/Resume/exports'
import { Uri } from '@fp/Uri/exports'

import { HistoryEnv } from './HistoryEnv'

/**
 * An Effect for change the current Uri using the History API.
 */
export const pushUri = (uri: Uri) =>
  fromEnv<HistoryEnv, Location>((e) =>
    async((cb) => {
      e.history.pushState(null, '', Uri.unwrap(uri))

      return cb(e.location)
    }),
  )
