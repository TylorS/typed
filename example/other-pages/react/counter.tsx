import { range } from '@effect/data/ReadonlyArray'
import { sync } from '@effect/io/Effect'
import { Route } from '@typed/route'

import { Counter } from '../../components/react-counter.jsx'

import { renderReact } from './render-react.js'

export const route = Route('/react/:counter')

export const main = renderReact(route, ({ counter }) => <Counter name={counter} />)

export const getStaticPaths = sync(() =>
  range(0, 10).map((i) => route.make({ counter: i.toString() })),
)
