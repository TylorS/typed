import { fromEnv, async } from '@typed/fp/Effect'
import { HistoryEnv } from './HistoryEnv'
import { Uri, uriIso } from '@typed/fp/Uri'

export const pushUri = (uri: Uri) =>
  fromEnv<HistoryEnv<unknown>, Location>((e) =>
    async((cb) => {
      e.history.pushState(null, '', uriIso.unwrap(uri))

      return cb(e.location)
    }),
  )
