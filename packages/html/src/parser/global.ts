import { globalValue } from '@effect/data/GlobalValue'

import { Parser } from './parser.js'

export const globalParser = globalValue('@typed/html/Parser', () => new Parser())
