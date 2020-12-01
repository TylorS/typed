import { describe, given, it } from '@typed/test'
import { isNone, isSome, Some } from 'fp-ts/Option'

import { matchRoute } from './matchRoute'
import { createRoute, GetRouteValue, Route } from './Route'

export const test = describe(`matchRoute`, [
  given(`a Route`, [
    it(`returns Match<string, ValuesOf<Route>>`, ({ ok, equal }) => {
      type FooBar = Route<['foo', ':bar']>
      type Test = Route<[FooBar, ':baz']>
      type Values = GetRouteValue<Test>
      const expected: Values = { bar: 'whatever', baz: 'example' }
      const test = createRoute<Test>('/foo/:bar/:baz')
      const matchTest = matchRoute(test)

      const option = matchTest(`/foo/${expected.bar}/${expected.baz}`)

      ok(isSome(option))
      equal(expected, (option as Some<Values>).value)

      ok(isNone(matchTest('/anything/else')))
      ok(isNone(matchTest('/else')))
    }),
  ]),
])
