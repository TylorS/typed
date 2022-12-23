import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'
import * as Path from '@typed/path'
import * as Route from '@typed/route'
import * as Router from '@typed/router'

import { IntrinsicServices } from './IntrinsicServices.js'
import { Module } from './Module.js'

export type Modules = readonly [Module<string>, ...Module<string>[]]

export function runModules<M extends Modules, B>(
  modules: readonly [...M],
  f: (matcher: Router.RouteMatcher<IntrinsicServices, never, Node>) => B,
): B {
  const [first, ...rest] = modules

  return f(rest.map(Module.toMatcher).reduce(Router.RouterMatcher.concat, Module.toMatcher(first)))
}

export function runNotFound<M extends Modules, R, E>(
  modules: readonly [...M],
  f: (path: string) => Fx.Fx<R, E, Node>,
): Fx.Fx<R | IntrinsicServices | Router.Router, Exclude<E, Router.Redirect>, Node> {
  return runModules(modules, (matcher) => matcher.notFound(f))
}

export function runNotFoundEffect<M extends Modules, R, E>(
  modules: readonly [...M],
  f: (path: string) => Effect.Effect<R, E, Node>,
): Fx.Fx<R | IntrinsicServices | Router.Router, Exclude<E, Router.Redirect>, Node> {
  return runModules(modules, (matcher) => matcher.notFoundEffect(f))
}

export function runRedirectTo<M extends Modules, R, P extends string>(
  modules: readonly [...M],
  route: Route.Route<R, P>,
  ...[params]: [keyof Path.ParamsOf<P>] extends [never] ? [] : [Path.ParamsOf<P>]
): Fx.Fx<R | Router.Router, never, Node> {
  // @ts-expect-error - This is because TS cannot understand the optionality of the params
  return runModules(modules, (matcher) => matcher.redirectTo(route, params ?? {}))
}
