import { fromEnv } from '@typed/fp/Effect/exports'
import { async } from '@typed/fp/Resume/exports'
import { Uri } from '@typed/fp/Uri/exports'

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
