import { describe, given, it, Test } from '@typed/test'

import { pathIso, pathJoin } from '.'

export const test: Test = describe(`pathJoin`, [
  given(`a array of paths without deliminators`, [
    it(`joins the path parts with deliminators`, ({ equal }) => {
      const parts = ['a', 'b', 'c']
      const expected = pathIso.wrap('/a/b/c')
      const actual = pathJoin(parts)

      equal(expected, actual)
    }),
  ]),

  given(`a array of paths with many deliminators`, [
    it(`joins the path parts with only a single deliminator between each`, ({ equal }) => {
      const parts = ['//a//', '//b////', 'c//']
      const expected = pathIso.wrap('/a/b/c/')
      const actual = pathJoin(parts)

      equal(expected, actual)
    }),
  ]),

  given(`an array with && expressions`, [
    it(`filters out non-string values`, ({ equal }) => {
      const parts = ['a', false && 'b', 'c']
      const expected = pathIso.wrap('/a/c')
      const actual = pathJoin(parts)

      equal(expected, actual)
    }),
  ]),

  given('an array of paths and trailingSlash=true', [
    it(`returns a path with a trailing slash`, ({ equal }) => {
      const parts = ['a', 'b', 'c']
      const expected = pathIso.wrap('/a/b/c/')
      const actual = pathJoin(parts, true)

      equal(expected, actual)
    }),
  ]),
])
