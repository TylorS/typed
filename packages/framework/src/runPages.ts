import { isLayer } from '@effect/io/Layer'
import { isContext } from '@fp-ts/data/Context'
import { flow, pipe } from '@fp-ts/data/Function'
import * as Fx from '@typed/fx'
import { Renderable } from '@typed/html'
import { Route } from '@typed/route'
import * as Router from '@typed/router'

import { IntrinsicServices } from './IntrinsicServices.js'
import { Module, Main } from './Module.js'
import {
  RedirectFallback,
  RenderableFallback,
  Fallback,
  buildModules,
  pathCardinality,
} from './buildModules.js'

const fallbackRegex = /fallback\.(ts|js)x?$/
const layoutRegex = /layout\.(ts|js)x?$/

// TODO: This is super hacky still, need to clean it up quite a lot

/**
 * Allows converting the result of `import.meta.glob('glob-pattern-here', { eager: true })` into an application
 * dynamically, mainly useful for development. For faster startup times, it is recommended to use the compiler.
 */
export function runPages(
  pages: Record<string, unknown>,
): Fx.Fx<IntrinsicServices, never, Renderable> {
  // TODO: Hanlde nested routers better
  const organized = organizePages(pages)
  const matchers = Object.entries(organized).map(([directory, page]) =>
    pageLikeToMatcher(directoryToPageLike(directory, page)),
  )

  return Fx.mergeAll(...matchers.map(runPageLikeMatchers))
}

function runPageLikeMatchers(
  matcher: PageLikeMatcher,
): Fx.Fx<IntrinsicServices | Router.Router, never, Renderable> {
  const [m, fallback] = matcher

  return fallback.type === 'Redirect'
    ? m.redirectTo(fallback.route, fallback.params)
    : m.notFound(fallback.fallback)
}

function isModuleLike(u: unknown): u is ModuleLike {
  return typeof u === 'object' && u !== null && 'route' in u && ('main' in u || 'render' in u)
}

interface ModuleLike {
  readonly route: unknown
  readonly main?: unknown
  readonly render?: unknown
  readonly environment?: unknown
  readonly layout?: unknown
}

function toModule(moduleLike: ModuleLike): Mutable<Module<IntrinsicServices, string>> {
  if (!isRoute(moduleLike.route)) {
    throw new Error('Invalid route: ' + JSON.stringify(moduleLike.route, null, 2))
  }

  let main = moduleLike.main

  if (Fx.isFx(main)) {
    main = () => main
  }

  if (typeof main !== 'function') {
    throw new Error('Invalid main: ' + JSON.stringify(main, null, 2))
  }

  const module: Mutable<Module<IntrinsicServices, string>> = {
    route: moduleLike.route as Module<IntrinsicServices, string>['route'],
    main: toMain(moduleLike.main, moduleLike.environment) as Module<
      IntrinsicServices,
      string
    >['main'],
    meta: {
      layout: moduleLike.layout ? toLayout(moduleLike.layout) : undefined,
    },
  }

  return module
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] }

function isRedirectFallbackLike(u: unknown): u is RedirectFallbackLike {
  return (
    typeof u === 'object' &&
    u !== null &&
    'route' in u &&
    ('params' in u ? typeof u.params === 'object' : true)
  )
}

function isRenderableFallbackLike(u: unknown): u is RenderableFallbackLike {
  if (typeof u !== 'object' || u === null) {
    return false
  }

  return 'main' in u || 'fallback' in u
}

interface RedirectFallbackLike {
  readonly route: unknown
  readonly params?: unknown
}

function toRedirectFallback(fallbackLike: RedirectFallbackLike): RedirectFallback<string> {
  if (!isRoute(fallbackLike.route)) {
    throw new Error('Invalid route: ' + JSON.stringify(fallbackLike.route, null, 2))
  }

  return RedirectFallback(fallbackLike.route, fallbackLike.params ?? {})
}

interface RenderableFallbackLike {
  readonly main?: unknown
  readonly fallback?: unknown
  readonly environment?: unknown
}

function toRenderableFallback(fallbackLike: RenderableFallbackLike): RenderableFallback {
  return RenderableFallback(
    toMain(fallbackLike.main || fallbackLike.fallback, fallbackLike.environment) as any,
  )
}

function toMain<R extends Route<any, any>>(main: unknown, environment?: unknown) {
  if (Fx.isFx(main)) {
    main = () => main
  }

  if (typeof main !== 'function') {
    throw new Error('Invalid main: ' + JSON.stringify(main, null, 2))
  }

  if (environment) {
    if (isLayer(environment)) {
      return flow(main as Main<IntrinsicServices, R>, Fx.provideSomeLayer(environment))
    } else if (isContext(environment)) {
      return flow(main as Main<IntrinsicServices, R>, Fx.provideSomeEnvironment(environment))
    }

    throw new Error('Invalid environment: ' + JSON.stringify(environment, null, 2))
  }

  return main as Main<IntrinsicServices, R>
}

function isRoute(u: unknown): u is Route<any, any> {
  return (
    typeof u === 'object' &&
    u !== null &&
    'path' in u &&
    typeof u.path === 'string' &&
    'match' in u &&
    typeof u.match === 'function'
  )
}

function isLayoutLike(u: unknown): u is LayoutLike {
  return typeof u === 'object' && u !== null && ('main' in u || 'layout' in u)
}

interface LayoutLike {
  readonly main?: unknown
  readonly layout?: unknown
  readonly environment?: unknown
}

function toLayout(layoutLike: LayoutLike): Module.Meta['layout'] {
  const layout = layoutLike.layout || layoutLike.main
  const environment = layoutLike.environment

  if (!layout || !Fx.isFx(layout)) {
    throw new Error('Invalid layout: ' + JSON.stringify(layout, null, 2))
  }

  if (environment) {
    if (isLayer(environment)) {
      return pipe(
        layout as NonNullable<Module.Meta['layout']>,
        Fx.provideSomeLayer<any, any, any>(environment),
      )
    } else if (isContext(environment)) {
      return pipe(
        layout as NonNullable<Module.Meta['layout']>,
        Fx.provideSomeEnvironment(environment),
      )
    }

    throw new Error('Invalid environment: ' + JSON.stringify(environment, null, 2))
  }

  return layout as Module.Meta['layout']
}

type FallbackLike = RedirectFallbackLike | RenderableFallbackLike

function isFallbackLike(u: unknown): u is FallbackLike {
  return isRedirectFallbackLike(u) || isRenderableFallbackLike(u)
}

type PageLikeMatcher = readonly [Router.RouteMatcher<IntrinsicServices, Router.Redirect>, Fallback]

function pageLikeToMatcher(
  pageLike: PageLike,
  parentLayout?: Module.Meta['layout'],
): PageLikeMatcher {
  const { modules, layout } = buildModulesWithLayout(pageLike, parentLayout)
  const children = pageLike.children.flatMap((p) => buildModulesWithLayout(p, layout).modules)
  const matcher = buildModules([...modules, ...children])

  if (!pageLike.fallback) {
    throw new Error(`No fallback provided for ${pageLike.directory}`)
  }

  const fallback = isRedirectFallbackLike(pageLike.fallback)
    ? toRedirectFallback(pageLike.fallback)
    : toRenderableFallback(pageLike.fallback)

  return [matcher, fallback]
}

function buildModulesWithLayout(pageLike: PageLike, parentLayout?: Module.Meta['layout']) {
  const layout = pageLike.layout ? toLayout(pageLike.layout) : parentLayout

  return {
    modules: pageLike.modules.map((m) => {
      const mod = toModule(m)

      if (layout && !mod.meta?.layout) {
        mod.meta = { ...mod.meta, layout }
      }

      return mod
    }),
    layout,
  }
}

interface PageLike {
  readonly directory: string
  readonly modules: readonly ModuleLike[]
  readonly fallback?: FallbackLike
  readonly layout?: LayoutLike
  readonly children: readonly PageLike[]
}

function directoryToPageLike(directory: string, [pages, children]: Pages[string]): PageLike {
  const modules = pages.flatMap(([path, p]) =>
    !fallbackRegex.test(path) && !layoutRegex.test(path) && isModuleLike(p) ? [p] : [],
  )
  const fallback = pages.flatMap(([path, p]) =>
    fallbackRegex.test(path) && isFallbackLike(p) ? [p] : [],
  )
  const layout = pages.flatMap(([path, p]) =>
    layoutRegex.test(path) && isLayoutLike(p) ? [p] : [],
  )

  // TODO: Improve error message
  if (fallback.length > 1) {
    throw new Error(`Multiple fallbacks in the same directory: ${directory}`)
  }

  // TODO: Improve error message
  if (layout.length > 1) {
    throw new Error(`Multiple layouts in the same directory: ${directory}`)
  }

  const pageLike: PageLike = {
    directory,
    modules,
    fallback: fallback[0],
    layout: layout[0],
    children: Object.entries(children).map(([directory, child]) =>
      directoryToPageLike(directory, child),
    ),
  }

  return pageLike
}

interface Pages {
  [path: string]: [Array<readonly [string, unknown]>, Pages]
}

function organizePages(pages: Record<string, unknown>): Pages {
  const pageEntries = Object.entries(pages).sort(([a], [b]) => pathCardinality(a, b))

  return pageEntries.reduce((pagesByDirectory, [path, page]) => {
    addAncestorDirectory(path, page, pagesByDirectory)

    return pagesByDirectory
  }, {} as Mutable<Pages>)
}

function getDirectory(path: string) {
  const i = path.lastIndexOf('/')

  if (i === -1) {
    return path
  }

  return path.slice(0, i)
}

function findAncestorDirectory(path: string, pagesByDirectory: Pages) {
  let parentDirectory = getDirectory(path)

  while (parentDirectory !== '.') {
    if (pagesByDirectory[parentDirectory]) {
      return pagesByDirectory[parentDirectory]
    }

    parentDirectory = getDirectory(parentDirectory)
  }

  const dir = getDirectory(path)

  if (!pagesByDirectory[dir]) {
    pagesByDirectory[dir] = [[], {}]
  }

  return pagesByDirectory[dir]
}

function addAncestorDirectory(path: string, page: unknown, pagesByDirectory: Pages) {
  const directory = findAncestorDirectory(path, pagesByDirectory)

  directory[0].push([path, page])
}
