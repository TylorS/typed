import { empty } from '@typed/fx/empty'
import { testCollectAll } from '@typed/fx/test-utils'

describe(__filename, () => {
  describe(empty.name, () => {
    testCollectAll('immediately ends', empty(), [])
  })
})
