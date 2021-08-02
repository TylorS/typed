import { deepStrictEqual } from 'assert'
import { describe } from 'mocha'

import * as D from './Decoder'

describe(__filename, () => {
  describe(D.fromStruct.name, () => {
    const PostEmailBody = D.fromStruct({
      to: D.string,
      to_name: D.string,
      from: D.string,
      from_name: D.string,
      subject: D.string,
      body: D.string,
    })

    deepStrictEqual(PostEmailBody.decode({}), {})
  })
})
