import * as Option from '@effect/data/Option'
import type * as P from '@typed/path'
import * as ptr from 'path-to-regexp'

export interface Route<in out Path extends string> {
  /**
   * The path of the route
   */
  readonly path: Path

  /**
   * Create a path from the given params
   */
  readonly make: <Params extends P.ParamsOf<Path>>(params: Params) => P.Interpolate<Path, Params>

  /**
   * Match a path against the route
   */
  readonly match: (path: string) => Option.Option<P.ParamsOf<Path>>
}

export function Route<Path extends string = string>(path: Path): Route<Path> {
  const route: Route<Path> = {
    path,
    make: Route.makeConstructor(path),
    match: Route.makeMatch(path),
  }

  return route
}

export namespace Route {
  // Wrappers around path-to-regexp to make it more type-safe

  export function makeConstructor<P extends string>(path: P): Route<P>['make'] {
    return ptr.compile(path) as Route<P>['make']
  }

  export function makeMatch<P extends string>(path: P): Route<P>['match'] {
    const parse_ = ptr.match(path, { end: false })

    return (input: string) => {
      const match = parse_(input)

      return !match ? Option.none() : Option.some({ ...match.params } as unknown as P.ParamsOf<P>)
    }
  }
}
