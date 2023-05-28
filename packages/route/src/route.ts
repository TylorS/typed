import * as Option from '@effect/data/Option'
import * as Path from '@typed/path'
import * as ptr from 'path-to-regexp'

export interface Route<P extends string> {
  readonly path: P
  readonly make: MakeRoute<P>
  readonly match: (path: string) => Option.Option<Path.ParamsOf<P>>
}

export type MakeRoute<P extends string> = [keyof Path.ParamsOf<P>] extends [never]
  ? () => P
  : <Params extends Path.ParamsOf<P>>(params: Params) => Path.Interpolate<P, Params>

export function Route<P extends string>(path: P, options?: RouteOptions): Route<P> {
  const match = Route.makeMatch(path, options?.match)

  return {
    path,
    make: ptr.compile(path, options?.make) as Route<P>['make'],
    match,
  }
}

export interface RouteOptions {
  readonly make?: ptr.ParseOptions & ptr.TokensToFunctionOptions
  readonly match?: ptr.ParseOptions & ptr.TokensToRegexpOptions & ptr.RegexpToFunctionOptions
}

export namespace Route {
  export function makeMatch<P extends string>(
    path: P,
    options?: RouteOptions['match'],
  ): Route<P>['match'] {
    const parse_ = ptr.match(path, { end: false, ...options })

    return (input: string) => {
      const match = parse_(input)

      return !match
        ? Option.none()
        : Option.some({ ...match.params } as unknown as Path.ParamsOf<P>)
    }
  }
}
