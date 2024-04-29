import { Option } from "effect"
import type { AST, Concat, QueryParam, QueryParams } from "./AST.js"
import { getAstSegments } from "./AST.js"

export type Matcher = (
  pathSegments: Array<string>,
  query: URLSearchParams
) => Option.Option<Record<string, string | ReadonlyArray<string>>>

export function astToMatcher(ast: AST): Matcher {
  const ctx: { unnamed: number } = { unnamed: 0 }
  const matchers = getAstSegments(ast).map((segment) => astSegmentToMatcher(segment, ctx))
  return (pathSegments, query) => {
    const result: Record<string, string | ReadonlyArray<string>> = {}

    for (const matcher of matchers) {
      const match = matcher(pathSegments, query)
      if (Option.isNone(match)) {
        return Option.none()
      }
      Object.assign(result, match.value)
    }

    return Option.some(result)
  }
}

function astSegmentToMatcher(astSegment: ReadonlyArray<AST>, ctx: { unnamed: number }): Matcher {
  if (astSegment.length === 0) {
    throw new Error("Empty AST segment")
  } else if (astSegment.length === 1) {
    const [ast] = astSegment
    if (ast._tag === "Concat") {
      throw new Error("Unexpected Concatatenation of AST segments")
    } else if (ast._tag === "QueryParams") {
      return queryParamsToMatcher(ast, ctx)
    }
    return simpleAstToMatcher(ast, ctx)
  } else {
    const parts = astSegment.map((ast) => simpleAstToMatcher(ensureSimpleAst(ast), ctx))
    return (pathSegments, query) => {
      const result = parts.flatMap((part) => {
        return part(pathSegments, query)
      })
      if (result.length === astSegment.length) {
        return Option.some(Object.assign({}, ...result))
      }
      return Option.none()
    }
  }
}

function simpleAstToMatcher(
  ast: Exclude<AST, Concat<any, any> | QueryParams<any>>,
  ctx: { unnamed: number },
  isOptional: boolean = false,
  isMultiple: boolean = false
): Matcher {
  switch (ast._tag) {
    case "Optional":
      return simpleAstToMatcher(ensureSimpleAst(ast.param), ctx, true, isMultiple)
    case "OneOrMore":
      return simpleAstToMatcher(ensureSimpleAst(ast.param), ctx, isOptional, true)
    case "ZeroOrMore":
      return simpleAstToMatcher(ensureSimpleAst(ast.param), ctx, true, true)
    case "WithSchema":
      return simpleAstToMatcher(ensureSimpleAst(ast.ast), ctx, isOptional, isMultiple)
    case "Literal":
      return (pathSegments) => {
        if (pathSegments[0] === ast.literal) {
          pathSegments.shift()
          return Option.some({})
        } else {
          return Option.none()
        }
      }
    case "Prefix": {
      const inner = simpleAstToMatcher(ensureSimpleAst(ast.param), ctx, isOptional, isMultiple)
      return (pathSegments, query) => {
        if (pathSegments[0].startsWith(ast.prefix)) {
          pathSegments[0] = pathSegments[0].slice(ast.prefix.length)
          return inner(pathSegments, query)
        } else {
          return Option.none()
        }
      }
    }
    case "Param": {
      return getParamByKey(ast.param, isOptional, isMultiple)
    }
    case "UnnamedParam": {
      return getParamByKey(ctx.unnamed++, isOptional, isMultiple)
    }
  }
}

function getParamByKey(key: string | number, isOptional: boolean, isMultiple: boolean): Matcher {
  return (pathSegments) => {
    if (!isOptional && pathSegments.length === 0) {
      return Option.none()
    }

    if (isMultiple) {
      return Option.some({ [key]: pathSegments })
    }

    const value = pathSegments.shift()
    if (isOptional && !value) {
      return Option.some({})
    }
    if (!value) {
      return Option.none()
    }

    return Option.some({ [key]: isMultiple ? value.split("/") : value })
  }
}

function queryParamsToMatcher(
  queryParams: QueryParams<ReadonlyArray<QueryParam<string, AST>>>,
  ctx: { unnamed: number }
): Matcher {
  const matchers = queryParams.params.map((param) =>
    simpleAstToQueryMatcher(param.key, ensureSimpleAst(param.value), ctx)
  )

  return (pathSegments, query) => {
    const result: Record<string, string | ReadonlyArray<string>> = {}

    for (const matcher of matchers) {
      const match = matcher(pathSegments, query)
      if (Option.isNone(match)) {
        return Option.none()
      }
      Object.assign(result, match.value)
    }

    return Option.some(result)
  }
}
function simpleAstToQueryMatcher(
  key: string,
  ast: Exclude<AST, Concat<any, any> | QueryParams<any>>,
  ctx: { unnamed: number },
  isOptional: boolean = false,
  isMultiple: boolean = false
): Matcher {
  switch (ast._tag) {
    case "Optional":
      return simpleAstToQueryMatcher(key, ensureSimpleAst(ast.param), ctx, true, isMultiple)
    case "OneOrMore":
      return simpleAstToQueryMatcher(key, ensureSimpleAst(ast.param), ctx, isOptional, true)
    case "ZeroOrMore":
      return simpleAstToQueryMatcher(key, ensureSimpleAst(ast.param), ctx, true, true)
    case "WithSchema":
      return simpleAstToQueryMatcher(key, ensureSimpleAst(ast.ast), ctx, isOptional, isMultiple)
    case "Literal":
      return (_, query) => {
        if (query.get(key) === ast.literal) {
          return Option.some({})
        } else {
          return Option.none()
        }
      }
    case "Prefix": {
      const inner = simpleAstToQueryMatcher(key, ensureSimpleAst(ast.param), ctx, isOptional, isMultiple)
      return (_, query) => {
        const values = query.getAll(key)
        const trimmed = values.map((value) => value.slice(ast.prefix.length))
        query.delete(key)
        for (const value of trimmed) {
          query.append(key, value)
        }
        return inner(_, query)
      }
    }
    case "Param": {
      return getQueryParamByKey(key, ast.param, isOptional, isMultiple)
    }
    case "UnnamedParam": {
      return getQueryParamByKey(key, ctx.unnamed++, isOptional, isMultiple)
    }
  }
}

function getQueryParamByKey(key: string, outKey: string | number, isOptional: boolean, isMultiple: boolean): Matcher {
  return (_, query) => {
    if (isMultiple) {
      const values = query.getAll(key)

      if (isOptional) return Option.some({ [outKey]: values })

      if (values.length === 0) return Option.none()
      return Option.some({ [outKey]: values })
    } else {
      const value = query.get(key)

      if (isOptional && value === null) return Option.some({})
      if (value === null) return Option.none()

      return Option.some({ [outKey]: value })
    }
  }
}

function ensureSimpleAst(ast: AST): Exclude<AST, Concat<any, any> | QueryParams<any>> {
  if (ast._tag === "Concat") {
    throw new Error("Unexpected Concatatenation of AST segments")
  } else if (ast._tag === "QueryParams") {
    throw new Error("Unexpected QueryParams")
  }
  return ast
}
