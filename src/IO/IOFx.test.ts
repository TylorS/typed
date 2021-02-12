import { describe, it } from '@typed/test'
import * as IO from 'fp-ts/IO'

import * as IOFx from './'
import { doIO, toIO } from './IoFx'

export const test = describe(`IOFx`, [
  it(`provides do-notation for IO`, ({ equal }) => {
    const fx = doIO(function* (liftIO) {
      const [x, y] = yield* IOFx.zip([liftIO(IO.of(1)), IOFx.of(2)])

      return x + y
    })
    const io = toIO(fx)

    equal(3, io())
  }),
])
