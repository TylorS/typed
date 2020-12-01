import { Path } from '@typed/fp/Path/exports'
import { describe, given, it } from '@typed/test'

import { createPath } from './createPath'
import { createRoute, GetRouteValue, Route } from './Route'

export const test = describe(`createPath`, [
  given(`a Route`, [
    it(`returns (RouteValues -> Path)`, ({ equal }) => {
      type FooBar = Route<['foo', ':bar']>
      type Test = Route<[FooBar, ':baz']>
      type Values = GetRouteValue<Test>
      const values: Values = { bar: 'whatever', baz: 'example' }
      const test = createRoute<Test>('/foo/:bar/:baz')
      const expected = Path.wrap(`/foo/${values.bar}/${values.baz}`)
      const createTestPath = createPath(test)
      const actual = createTestPath(values)

      equal(expected, actual)
    }),
  ]),
])
