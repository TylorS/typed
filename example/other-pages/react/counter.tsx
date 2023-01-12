import { Route } from '@typed/route'
import * as React from 'react'

import { Counter } from '../../components/react-counter.jsx'
import { renderReact } from '../../render-react.js'

export const route = Route('/react/:counter')

export const main = renderReact(route, ({ counter }) => <Counter name={counter} />)
