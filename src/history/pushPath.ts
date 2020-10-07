import { async, fromEnv } from '@typed/fp/Effect/exports'
import { Path } from '@typed/fp/Path/exports'

import { HistoryEnv } from './HistoryEnv'

/**
 * @since 0.0.1
 */
export const pushPath = (path: Path) =>
  fromEnv<HistoryEnv<unknown>, Location>((e) =>
    async((cb) => {
      e.history.pushState(null, '', Path.unwrap(path))

      return cb(e.location)
    }),
  )
