/// <reference types="svelte" />
import { identity } from '@fp-ts/data/Function'
import { Route } from '@typed/route'

import Hello from '../../components/Hello.svelte'

import { renderSvelte } from './render-svelte.js'

export const route = Route('/svelte/:name')

export const main = renderSvelte(route, Hello, identity)
