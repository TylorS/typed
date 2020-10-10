import { fromEnv } from '@typed/fp/Effect/exports'
import { Path } from '@typed/fp/Path/exports'
import { async } from '@typed/fp/Resume/exports'

import { HistoryEnv } from './HistoryEnv'

export const pushPath = (path: Path) =>
  fromEnv<HistoryEnv<unknown>, Location>((e) =>
    async((cb) => {
      e.history.pushState(null, '', Path.unwrap(path))

      return cb(e.location)
    }),
  )
