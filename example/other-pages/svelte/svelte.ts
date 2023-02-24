/// <reference types="svelte" />
import { identity } from '@effect/data/Function'
import { range } from '@effect/data/ReadonlyArray'
import { sync } from '@effect/io/Effect'
import { Route } from '@typed/route'

import Hello from '../../components/Hello.svelte'

import { renderSvelte } from './render-svelte.js'

export const route = Route('/svelte/:name')

export const main = renderSvelte(route, Hello, identity)

export const getStaticPaths = sync(() =>
  range(0, 10).map((i) => route.make({ name: i.toString() })),
)
