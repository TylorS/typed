/// <reference types="svelte" />
import { sync } from '@effect/io/Effect'
import { identity } from '@fp-ts/core/Function'
import { range } from '@fp-ts/core/ReadonlyArray'
import { Route } from '@typed/route'

import Hello from '../../components/Hello.svelte'

import { renderSvelte } from './render-svelte.js'

export const route = Route('/svelte/:name')

export const main = renderSvelte(route, Hello, identity)

export const getStaticPaths = sync(() =>
  range(0, 10).map((i) => route.make({ name: i.toString() })),
)
