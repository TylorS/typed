import { millis } from '@effect/data/Duration'
import { describe } from 'vitest'

import { at } from './at.js'
import { mergeAll } from './mergeAll.js'
import { mergeConcurrently } from './mergeConcurrently.js'
import { testCollectAll } from './test-utils.js'

describe(__filename, () => {
  describe(mergeConcurrently.name, () => {
    testCollectAll(
      'merges multiple streams together taking 1 value from each in order, but always the latest value from each stream',
      mergeConcurrently(
        at(1, millis(100)),
        mergeAll(at(2, millis(0)), at(3, millis(30)), at(4, millis(60))),
      ),
      [1, 4],
    )
  })
})
