import { Route } from '@typed/route'

import { Counter } from '../../components/react-counter.js'
import { renderReact } from '../../render-react.js'

export const route = Route('/react/:counter')

export const main = renderReact(route, ({ counter }) => <Counter name={counter} />)
