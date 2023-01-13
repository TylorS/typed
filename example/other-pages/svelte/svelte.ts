/// <reference types="svelte" />
import { Route } from '@typed/route'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore Svelte types do not work with NodeNext Resolution?
import Hello from '../../components/Hello.svelte'

import { renderSvelte } from './render-svelte.js'

export const route = Route('/svelte/:name')

export const main = renderSvelte(route, Hello, ({ name }) => ({ name }))
