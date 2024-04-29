/**
 * @since 5.0.0
 */

import { AST, Schema } from "@effect/schema"
import { getPropertySignatures, PropertySignature, TypeLiteral } from "@effect/schema/AST"
import * as P from "@typed/path"
import { Option } from "effect"

/**
 * @since 5.0.0
 */
export type AST =
  | Literal<string>
  | UnnamedParam
  | Param<string>
  | ZeroOrMore<AST>
  | OneOrMore<AST>
  | Optional<AST>
  | Prefix<string, AST>
  | QueryParams<ReadonlyArray<QueryParam<string, AST>>>
  | Concat<AST, AST>
  | WithSchema<AST, Schema.Schema.All>

/**
 * @since 5.0.0
 */
export class Literal<L extends string> {
  /**
   * @since 5.0.0
   */
  readonly _tag = "Literal" as const
  constructor(readonly literal: L) {}
}

/**
 * @since 5.0.0
 */
export class UnnamedParam {
  /**
   * @since 5.0.0
   */
  readonly _tag = "UnnamedParam" as const
}

/**
 * @since 5.0.0
 */
export class Param<P extends string> {
  /**
   * @since 5.0.0
   */
  readonly _tag = "Param" as const
  constructor(readonly param: P) {}
}

/**
 * @since 5.0.0
 */
export class ZeroOrMore<P extends AST> {
  /**
   * @since 5.0.0
   */
  readonly _tag = "ZeroOrMore" as const
  constructor(readonly param: P) {}
}

/**
 * @since 5.0.0
 */
export class OneOrMore<P extends AST> {
  /**
   * @since 5.0.0
   */
  readonly _tag = "OneOrMore" as const
  constructor(readonly param: P) {}
}

/**
 * @since 5.0.0
 */
export class Optional<P extends AST> {
  /**
   * @since 5.0.0
   */
  readonly _tag = "Optional" as const
  constructor(readonly param: P) {}
}

/**
 * @since 5.0.0
 */
export class Prefix<P extends string, A extends AST> {
  /**
   * @since 5.0.0
   */
  readonly _tag = "Prefix" as const
  constructor(readonly prefix: P, readonly param: A) {}
}

/**
 * @since 5.0.0
 */
export class Concat<L extends AST, R extends AST> {
  /**
   * @since 5.0.0
   */
  readonly _tag = "Concat" as const
  constructor(readonly left: L, readonly right: R) {}
}

/**
 * @since 5.0.0
 */
export class WithSchema<A extends AST, S extends Schema.Schema.All> {
  /**
   * @since 5.0.0
   */
  readonly _tag = "WithSchema" as const
  constructor(readonly ast: A, readonly schema: S) {}
}

/**
 * @since 5.0.0
 */
export class QueryParams<P extends ReadonlyArray<QueryParam<any, any>>> {
  /**
   * @since 5.0.0
   */
  readonly _tag = "QueryParams" as const
  constructor(readonly params: P) {}
}

/**
 * @since 5.0.0
 */
export class QueryParam<K extends string, V extends AST> {
  /**
   * @since 5.0.0
   */
  readonly _tag = "QueryParam" as const
  constructor(readonly key: K, readonly value: V) {}
}

const pathCache = new WeakMap<AST, string>()
const schemaCache = new WeakMap<AST, Schema.Schema.All>()
const pathSchemaCache = new WeakMap<AST, Schema.Schema.All>()
const querySchemaCache = new WeakMap<AST, Schema.Schema.All>()

function toPath_<A extends AST>(ast: A): string {
  switch (ast._tag) {
    case "Literal":
      return ast.literal
    case "UnnamedParam":
      return P.unnamed
    case "Param":
      return P.param(ast.param)
    case "ZeroOrMore":
      return P.zeroOrMore(toPath_(ast.param))
    case "OneOrMore":
      return P.oneOrMore(toPath_(ast.param))
    case "Optional":
      return P.optional(toPath_(ast.param))
    case "Prefix":
      return P.prefix(ast.prefix, toPath_(ast.param))
    case "Concat":
      return P.pathJoin(toPath_(ast.left), toPath_(ast.right))
    case "WithSchema":
      return toPath_(ast.ast)
    case "QueryParams":
      return P.queryParams(...ast.params.map(({ key, value }) => P.queryParam(key, toPath_(value))) as any)
  }
}

/**
 * @since 5.0.0
 */
export function toPath<A extends AST>(ast: A): string {
  const cached = pathCache.get(ast)
  if (cached) {
    return cached
  }

  const path = P.pathJoin(toPath_(ast))
  pathCache.set(ast, path)

  return path
}

function toParts<A extends AST>(
  ast: A
): Array<AST> {
  switch (ast._tag) {
    case "Optional":
    case "Prefix":
    case "OneOrMore":
    case "ZeroOrMore":
    case "Param":
    case "Literal":
    case "UnnamedParam":
    case "QueryParams":
      return [ast]
    case "WithSchema":
      return toParts(ast.ast)
    case "Concat":
      return [...toParts(ast.left), ...toParts(ast.right)]
  }
}

function toSchemas<A extends AST>(
  ast: A,
  includeQueryParams: boolean,
  ctx: { unnamed: number } = { unnamed: 0 }
): Array<Schema.Schema.All> {
  switch (ast._tag) {
    case "Literal":
      return []
    case "UnnamedParam": {
      const key = ctx.unnamed++
      const fields: any = {}
      fields[key] = Schema.String

      return [Schema.Struct(fields)]
    }
    case "Param":
      return [Schema.Struct({ [ast.param]: Schema.String })]
    case "ZeroOrMore":
      return toSchemas(ast.param, includeQueryParams, ctx).map(zeroOrMoreSchema)
    case "OneOrMore":
      return toSchemas(ast.param, includeQueryParams, ctx).map(oneOrMoreSchema)
    case "Prefix":
      return toSchemas(ast.param, includeQueryParams, ctx)
    case "Optional":
      return toSchemas(ast.param, includeQueryParams, ctx).map(orUndefinedSchema)
    case "Concat":
      return [...toSchemas(ast.left, includeQueryParams, ctx), ...toSchemas(ast.right, includeQueryParams, ctx)]
    case "WithSchema": {
      if (ast.schema.ast._tag === "TypeLiteral") {
        const signatures = ast.schema.ast.propertySignatures.map((s) =>
          new PropertySignature(
            typeof s.name === "number" ? ctx.unnamed++ : s.name,
            s.type,
            s.isOptional,
            s.isReadonly,
            s.annotations
          )
        )

        return [Schema.make(new TypeLiteral(signatures, ast.schema.ast.indexSignatures, ast.schema.ast.annotations))]
      }

      return [ast.schema]
    }
    case "QueryParams":
      return includeQueryParams ? ast.params.flatMap(({ value }) => toSchemas(value, includeQueryParams, ctx)) : []
  }
}

function zeroOrMoreSchema<S extends Schema.Schema.All>(schema: S): Schema.Schema.All {
  if (schema.ast._tag === "TypeLiteral") {
    return Schema.make(
      new TypeLiteral(
        schema.ast.propertySignatures.map((s) =>
          new PropertySignature(
            s.name,
            Schema.Array(Schema.make(s.type)).ast,
            true,
            s.isReadonly,
            s.annotations
          )
        ),
        schema.ast.indexSignatures,
        schema.ast.annotations
      )
    )
  }

  return Schema.Array(schema as any)
}

function oneOrMoreSchema<S extends Schema.Schema.All>(schema: S): Schema.Schema.All {
  if (schema.ast._tag === "TypeLiteral") {
    return Schema.make(
      new TypeLiteral(
        schema.ast.propertySignatures.map((s) =>
          new PropertySignature(
            s.name,
            Schema.NonEmptyArray(Schema.make(s.type)).ast,
            s.isOptional,
            s.isReadonly,
            s.annotations
          )
        ),
        schema.ast.indexSignatures,
        schema.ast.annotations
      )
    )
  }

  return Schema.Array(schema as any)
}

function orUndefinedSchema<S extends Schema.Schema.All>(schema: S): Schema.Schema.All {
  if (schema.ast._tag === "TypeLiteral") {
    return Schema.make(
      new TypeLiteral(
        schema.ast.propertySignatures.map((s) =>
          new PropertySignature(
            s.name,
            AST.Union.make([s.type, AST.undefinedKeyword, AST.null]),
            true,
            s.isReadonly,
            s.annotations
          )
        ),
        schema.ast.indexSignatures,
        schema.ast.annotations
      )
    )
  }

  return Schema.NullishOr(schema as any)
}

function toSchema_<A extends AST>(ast: A, includeQueryParams: boolean): Schema.Schema.All {
  const schemas = toSchemas(ast, includeQueryParams)

  if (schemas.length === 0) {
    return Schema.Record(Schema.String, Schema.Unknown)
  }

  return schemas.reduce(Schema.extend)
}

/**
 * @since 5.0.0
 */
export function toSchema<A extends AST>(ast: A): Schema.Schema.All {
  const cached = schemaCache.get(ast)
  if (cached) {
    return cached
  }

  const schema = toSchema_(ast, true)
  schemaCache.set(ast, schema)

  return schema
}

/**
 * @since 5.0.0
 */
export function toPathSchema<A extends AST>(ast: A): Schema.Schema.All {
  const cached = pathSchemaCache.get(ast)
  if (cached) {
    return cached
  }

  const schema = toSchema_(ast, false)
  pathSchemaCache.set(ast, schema)

  return schema
}

/**
 * @since 5.0.0
 */
export function toQuerySchema<A extends AST>(ast: A): Schema.Schema.All {
  const cached = querySchemaCache.get(ast)
  if (cached) {
    return cached
  }

  const schema = toQuerySchema_(ast)
  querySchemaCache.set(ast, schema)

  return schema
}

function toQuerySchema_<A extends AST>(ast: A): Schema.Schema.All {
  const parts = toParts(ast)
  const queryParams = parts.find((part): part is QueryParams<any> => part._tag === "QueryParams")
  if (queryParams) {
    return toSchema_(queryParams, true)
  } else {
    return Schema.Record(Schema.String, Schema.Unknown)
  }
}

/**
 * @since 5.0.0
 */
export function getQueryParams(ast: AST): QueryParams<ReadonlyArray<QueryParam<string, AST>>> | null {
  if (ast._tag === "QueryParams") {
    return ast
  } else if (ast._tag === "Concat") {
    return getQueryParams(ast.right)
  } else if (ast._tag === "WithSchema") {
    return getQueryParams(ast.ast)
  } else {
    return null
  }
}

/**
 * @since 5.0.0
 */
export function getOptionalQueryParams(ast: AST): ReadonlyArray<QueryParam<string, AST>> {
  const queryParams = getQueryParams(ast)
  if (queryParams === null) return []

  return queryParams.params.filter((x) => isOptional(x.value))
}

function isOptional(ast: AST): boolean {
  if (ast._tag === "Optional" || ast._tag === "ZeroOrMore") return true
  else if (ast._tag === "Concat") return isOptional(ast.left) && isOptional(ast.right)
  else if (ast._tag === "WithSchema") return isOptional(ast.ast) || isOptionalSchema(ast.schema)
  else if (ast._tag === "QueryParams") return ast.params.every((param) => isOptional(param.value))
  else return false
}

function isOptionalSchema(schema: Schema.Schema.All) {
  const propertySignatures = getPropertySignatures(schema.ast)
  if (propertySignatures.length === 0) return true
  return propertySignatures.every((ps) => ps.isOptional)
}

export function getAstSegments(part: AST): Array<Array<AST>> {
  const out: Array<Array<AST>> = []

  let current: Array<AST> = []

  switch (part._tag) {
    case "Literal": {
      if (part.literal === "/") {
        return []
      } else {
        current.push(part)
      }
      break
    }
    case "Param":
    case "UnnamedParam":
    case "ZeroOrMore":
    case "OneOrMore":
    case "Optional":
    case "Prefix":
      current.push(part)
      break
    case "Concat": {
      const l = getAstSegments(part.left)
      const r = getAstSegments(part.right)

      out.push(...l)
      out.push(...r)

      break
    }
    case "QueryParams":
      if (current.length > 0) {
        out.push(current)
        current = []
      }
      out.push([part])
      break
    case "WithSchema":
      return getAstSegments(part.ast)
  }

  if (current.length > 0) {
    out.push(current)
  }

  return out
}

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
    return new InterpolateLiteral(P.pathJoin(...parts.map((part) => (part as InterpolateLiteral).value)) || "/")
  }

  return new InterpolateParam((params) => {
    return P.pathJoin(...parts.map((part) => part._tag === "Literal" ? part.value : part.interpolate(params))) || "/"
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

export type Matcher = (
  pathSegments: Array<string>,
  query: URLSearchParams
) => Option.Option<Record<string, string | ReadonlyArray<string>>>

export function astToMatcher(ast: AST, end: boolean = false): Matcher {
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

    if (end && pathSegments.length > 0) {
      return Option.none()
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

      if (result.every(Option.isSome)) {
        return Option.some(Object.assign({}, ...result.flatMap((x) => Option.isSome(x) ? [x.value] : [])))
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

export function getPathAndQuery(path: string) {
  const { pathname, searchParams } = new URL(path, "http://localhost")
  const pathSegments = pathname.split(/\//g)
  if (pathSegments[0] === "") {
    pathSegments.shift()
  }
  if (pathSegments[pathSegments.length - 1] === "") {
    pathSegments.pop()
  }

  return [pathSegments, searchParams] as const
}
