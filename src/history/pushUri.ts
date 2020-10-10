import { fromEnv } from '@typed/fp/Effect/exports'
import { async } from '@typed/fp/Resume/exports'
import { Uri, uriIso } from '@typed/fp/Uri/exports'

import { HistoryEnv } from './HistoryEnv'

export const pushUri = (uri: Uri) =>
  fromEnv<HistoryEnv<unknown>, Location>((e) =>
    async((cb) => {
      e.history.pushState(null, '', uriIso.unwrap(uri))

      return cb(e.location)
    }),
  )
