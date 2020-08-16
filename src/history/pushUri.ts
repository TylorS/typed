import { async, fromEnv } from '@typed/fp/Effect'
import { Uri, uriIso } from '@typed/fp/Uri'

import { HistoryEnv } from './HistoryEnv'

/**
 * @since 0.0.1
 */
export const pushUri = (uri: Uri) =>
  fromEnv<HistoryEnv<unknown>, Location>((e) =>
    async((cb) => {
      e.history.pushState(null, '', uriIso.unwrap(uri))

      return cb(e.location)
    }),
  )
