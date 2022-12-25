import { Main } from '@typed/framework/Module.js'

import { Counter, liveExample } from '../components/counter-with-service.js'

import * as Route from '@typed/route/index.js'

export const route = Route.home

export const main = Main.make(route)(() => Counter)

export const environment: Main.LayerOf<typeof main> = liveExample
