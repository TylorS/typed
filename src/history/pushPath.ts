import { fromEnv } from '@typed/fp/Effect/exports'
import { Path } from '@typed/fp/Path/exports'
import { async } from '@typed/fp/Resume/exports'

import { HistoryEnv } from './HistoryEnv'

/**
 * An Effect for change the current Path using the History API.
 */
export const pushPath = (path: Path) =>
  fromEnv<HistoryEnv, Location>((e) =>
    async((cb) => {
      e.history.pushState(null, '', Path.unwrap(path))

      return cb(e.location)
    }),
  )
