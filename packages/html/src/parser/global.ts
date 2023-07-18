import { globalValue } from '@effect/data/Global'

import { Parser } from './parser.js'

export const globalParser = globalValue('@typed/html/Parser', () => new Parser())
