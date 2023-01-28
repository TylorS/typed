import { sync } from '@effect/io/Effect'
import { range } from '@fp-ts/core/ReadonlyArray'
import * as Route from '@typed/route'

import { Counter } from 'example/components/counter-with-dom-source.js'

export const route = Route.Route('/baz/:baz')

export const main = Counter

export const getStaticPaths = sync(() => range(0, 10).map((i) => route.make({ baz: i.toString() })))
