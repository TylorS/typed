import { describe, given, it } from '@typed/test'

import { fromJson, toJson } from './json'

export const test = describe(`toJson/fromJson`, [
  given(`a Map`, [
    it(`is properly serialized/deserialized`, ({ equal }) => {
      const sut = {
        map: new Map([
          [new Map([[1, 2]]), 2],
          [new Map([[2, 3]]), 3],
        ]),
      }
      const jsonString = toJson(sut)

      equal(
        '{"map":{"__json_tag__":1,"__values_tag__":[[{"__json_tag__":1,"__values_tag__":[[1,2]]},2],[{"__json_tag__":1,"__values_tag__":[[2,3]]},3]]}}',
        jsonString,
      )

      const actual = fromJson(jsonString)

      equal(sut, actual)
    }),
  ]),

  given(`a Set`, [
    it(`is properly serialized/deserialized`, ({ equal }) => {
      const sut = new Set([new Set([1, 2]), new Set([2, 3])])
      const jsonString = toJson(sut)

      equal(
        `{"__json_tag__":0,"__values_tag__":[{"__json_tag__":0,"__values_tag__":[1,2]},{"__json_tag__":0,"__values_tag__":[2,3]}]}`,
        jsonString,
      )

      const actual = fromJson(jsonString)

      equal(sut, actual)
    }),
  ]),
])
