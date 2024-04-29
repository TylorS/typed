import { pathJoin } from "@typed/path"
import type { AST, Concat, QueryParam, QueryParams } from "./AST.js"
import { getAstSegments } from "./AST.js"

export type InterpolationPart =
  | InterpolateLiteral
  | InterpolateParam

export class InterpolateLiteral {
  readonly _tag = "Literal" as const
  constructor(readonly value: string) {}
}

export class InterpolateParam {
  readonly _tag = "Param" as const
  constructor(
    readonly interpolate: Interpolater
  ) {}
}

export type Interpolater = (params: Readonly<Record<string, string | ReadonlyArray<string>>>) => string

export function astToInterpolation(ast: AST): InterpolationPart {
  const ctx: { unnamed: number } = { unnamed: 0 }
  const parts = getAstSegments(ast).map((segment) => astSegmentToInterpolationPart(segment, ctx))
  if (parts.every((part) => part._tag === "Literal")) {
    return new InterpolateLiteral(pathJoin(...parts.map((part) => (part as InterpolateLiteral).value)))
  }

  return new InterpolateParam((params) => {
    return pathJoin(...parts.map((part) => part._tag === "Literal" ? part.value : part.interpolate(params)))
  })
}

function astSegmentToInterpolationPart(astSegment: ReadonlyArray<AST>, ctx: { unnamed: number }): InterpolationPart {
  if (astSegment.length === 0) {
    throw new Error("Empty AST segment")
  } else if (astSegment.length === 1) {
    const [ast] = astSegment
    if (ast._tag === "Concat") {
      throw new Error("Unexpected Concatatenation of AST segments")
    } else if (ast._tag === "QueryParams") {
      return queryParamsToInterpolationPart(ast)
    }
    return simpleAstToInterpolationPart(ast, ctx)
  } else {
    const parts = astSegment.map((ast) => simpleAstToInterpolationPart(ensureSimpleAst(ast), ctx))
    return new InterpolateParam((params) => {
      return parts.flatMap((part) => {
        const value = part._tag === "Literal" ? part.value : part.interpolate(params)
        return value === "" ? [] : [value]
      }).join("")
    })
  }
}

function simpleAstToInterpolationPart(
  ast: Exclude<AST, Concat<any, any> | QueryParams<any>>,
  ctx: { unnamed: number },
  isOptional: boolean = false,
  isMultiple: boolean = false
): InterpolationPart {
  switch (ast._tag) {
    case "Literal": {
      return new InterpolateLiteral(ast.literal)
    }
    case "OneOrMore": {
      return simpleAstToInterpolationPart(ensureSimpleAst(ast.param), ctx, isOptional, true)
    }
    case "Optional": {
      return simpleAstToInterpolationPart(ensureSimpleAst(ast.param), ctx, true, isMultiple)
    }
    case "Param": {
      return new InterpolateParam(getParam(ast.param, isOptional, isMultiple))
    }
    case "Prefix": {
      const inner = simpleAstToInterpolationPart(ensureSimpleAst(ast.param), ctx, isOptional, isMultiple)
      if (inner._tag === "Literal") return new InterpolateLiteral(ast.prefix + inner.value)
      return new InterpolateParam((params) => {
        const value = inner.interpolate(params)
        return value === "" ? "" : ast.prefix + value
      })
    }
    case "UnnamedParam": {
      return new InterpolateParam(getParam(ctx.unnamed++, isOptional, isMultiple))
    }
    case "WithSchema": {
      return simpleAstToInterpolationPart(ensureSimpleAst(ast.ast), ctx, isOptional, isMultiple)
    }
    case "ZeroOrMore": {
      return simpleAstToInterpolationPart(ensureSimpleAst(ast.param), ctx, true, true)
    }
  }
}

function getParam(key: string | number, isOptional: boolean, isMultiple: boolean) {
  return (params: Readonly<Record<string, string | ReadonlyArray<string>>>): string => {
    const value = params[key]
    if (isOptional && !value) return ""
    if (!value) throw new Error(`Expected value for parameter ${key}`)
    if (Array.isArray(value)) {
      if (isOptional === false && value.length === 0) {
        throw new Error(`Expected value for at least one parameter ${key}`)
      }
      if (isMultiple) return value.join("/")
      throw new Error(`Expected single value for parameter ${key}`)
    } else {
      return value as string
    }
  }
}

function ensureSimpleAst(ast: AST): Exclude<AST, Concat<any, any> | QueryParams<any>> {
  if (ast._tag === "Concat") {
    throw new Error("Unexpected Concatatenation of AST segments")
  } else if (ast._tag === "QueryParams") {
    throw new Error("Unexpected QueryParams within query parameter")
  }
  return ast
}

function queryParamsToInterpolationPart(queryParams: QueryParams<any>): InterpolationPart {
  const parts: Array<InterpolationPart> = queryParams.params.map(queryParamToInterpolationPart)
  return new InterpolateParam(
    (params) => {
      const query = parts.flatMap((part) => {
        const value = part._tag === "Literal" ? part.value : part.interpolate(params)
        return value === "" ? [] : [value]
      }).join("&")
      return query === "" ? "" : `?${query}`
    }
  )
}

function queryParamToInterpolationPart(
  queryParam: QueryParam<string, any>,
  ctx: { unnamed: number }
): InterpolationPart {
  const { key, value } = queryParam
  const simplePart = simpleAstToInterpolationPart(ensureSimpleAst(value), ctx)
  if (simplePart._tag === "Literal") {
    return new InterpolateLiteral(`${key}=${simplePart.value}`)
  } else {
    return new InterpolateParam((params) => {
      const value = simplePart.interpolate(params)
      return value === "" ? "" : `${key}=${value}`
    })
  }
}
