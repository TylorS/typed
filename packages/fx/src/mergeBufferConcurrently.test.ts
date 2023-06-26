import { millis } from '@effect/data/Duration'
import { describe } from 'vitest'

import { at } from './at.js'
import { fromArray } from './fromArray.js'
import { mergeAll } from './mergeAll.js'
import { mergeBufferConcurrently } from './mergeBufferConcurrently.js'
import { testCollectAll } from './test-utils.js'

describe(__filename, () => {
  describe(mergeBufferConcurrently.name, () => {
    testCollectAll(
      'buffers values until the previous stream completes',
      mergeBufferConcurrently(
        at(1, millis(50)),
        mergeAll(at(2, millis(0)), at(3, millis(20)), at(4, millis(40))),
      ),
      [1, 2, 3, 4],
    )

    testCollectAll(
      'emits immediately if previous stream has ended',
      mergeBufferConcurrently(
        at(1, millis(0)),
        mergeAll(at(2, millis(5)), at(3, millis(10)), at(4, millis(20))),
        mergeAll(at(5, millis(0)), at(6, millis(5)), at(7, millis(10))),
      ),
      [1, 2, 3, 4, 5, 6, 7],
    )

    testCollectAll(
      'merges multiple synchronous streams',
      mergeBufferConcurrently(fromArray([1, 2, 3]), fromArray([4, 5, 6])),
      [1, 2, 3, 4, 5, 6],
    )
  })
})
