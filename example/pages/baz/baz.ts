import { range } from '@effect/data/ReadonlyArray'
import { sync } from '@effect/io/Effect'
import * as Route from '@typed/route'

import { Counter } from '../../components/counter-with-dom-source.js'

export const route = Route.Route('/baz/:baz')

export const main = Counter

export const getStaticPaths = sync(() => range(0, 10).map((i) => route.make({ baz: i.toString() })))
