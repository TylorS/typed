import { Layer } from '@effect/io/Layer'

import { Counter, Example, liveExample } from '../components/counter-with-service.js'

import * as Route from '@typed/route/index.js'

export const route = Route.home

export const main = Counter

export const environment: Layer<never, never, Example> = liveExample
