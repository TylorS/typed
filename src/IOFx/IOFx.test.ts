import * as IO from '@typed/fp/IO'
import { describe, it } from '@typed/test'

import * as IOFx from './'

export const test = describe(`IOFx`, [
  it(`provides do-notation for IO`, ({ equal }) => {
    const fx = IOFx.doIO(function* (liftIO) {
      const [x, y] = yield* IOFx.zip([liftIO(IO.of(1)), IOFx.of(2)])

      return x + y
    })
    const io = IOFx.toIO(fx)

    equal(3, io())
  }),
])
