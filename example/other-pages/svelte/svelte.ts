/// <reference types="svelte" />
import { range } from '@effect/data/ReadonlyArray'
import { succeed, sync } from '@effect/io/Effect'
import { Route } from '@typed/route'

import Hello from '../../components/Hello.svelte'

import { renderSvelte } from './render-svelte.js'

export const route = Route('/svelte/:name')

export const main = renderSvelte(route, Hello, succeed)

export const getStaticPaths = sync(() =>
  range(0, 10).map((i) => route.make({ name: i.toString() })),
)
