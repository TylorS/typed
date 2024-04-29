/**
 * @since 5.0.0
 */

import { Schema } from "@effect/schema"
import { getPropertySignatures, PropertySignature, TypeLiteral } from "@effect/schema/AST"
import * as P from "@typed/path"
import { Option } from "effect"
import { isArray, isEmptyReadonlyArray } from "effect/Array"

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
            s.type,
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

  return Schema.UndefinedOr(schema as any)
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

export function interpolate(
  ast: AST,
  values: { [key: string]: string | ReadonlyArray<string> }
): string {
  return P.pathJoin(interpolate_(ast, values))
}

function interpolate_(
  ast: AST,
  values: { [key: string | number]: string | ReadonlyArray<string> },
  isOptional: boolean = false,
  isMultiple: boolean = false,
  inQueryParameters: boolean = false,
  ctx: { unnamed: number } = { unnamed: 0 }
): string {
  let out: string = ""

  for (const part of toParts(ast)) {
    switch (part._tag) {
      case "Literal": {
        out = P.pathJoin(out, part.literal)
        continue
      }
      case "OneOrMore": {
        out = out + interpolate_(part.param, values, false, true, inQueryParameters)
        continue
      }
      case "Optional": {
        out = out + interpolate_(part.param, values, true, false, inQueryParameters)
        continue
      }
      case "Param": {
        const v = values[part.param]
        if (isOptional && v === undefined) continue
        if (v === undefined) {
          throw new Error(`Missing value for param: ${part.param}`)
        }

        if (isArray(v)) {
          if (isOptional && isEmptyReadonlyArray(v)) continue
          if (isMultiple) {
            out = P.pathJoin(out, ...v)
          } else {
            throw new Error(`Expected a single value for param: ${part.param} but received [${v.join(", ")}]`)
          }
        } else {
          out = out === "" ? v as string : P.pathJoin(out, v as string)
        }

        continue
      }
      case "Prefix": {
        const p = interpolate_(part.param, values, isOptional, isMultiple, inQueryParameters)
        out = P.pathJoin(out, part.prefix + p)
        continue
      }
      case "UnnamedParam": {
        const i = ctx.unnamed++
        const v = values[i]
        if (isOptional && v === undefined) continue
        if (v === undefined) {
          throw new Error(`Missing value for param: ${i}`)
        }

        if (isArray(v)) {
          if (isOptional && isEmptyReadonlyArray(v)) continue
          if (isMultiple) {
            out = P.pathJoin(out, ...v)
          } else {
            throw new Error(`Expected a single value for param: ${i} but received [${v.join(", ")}]`)
          }
        } else {
          out = out === "" ? v as string : P.pathJoin(out, v as string)
        }

        continue
      }
      case "ZeroOrMore": {
        out = P.pathJoin(out, interpolate_(part.param, values, true, true, inQueryParameters))
        continue
      }
      case "QueryParams": {
        const query = part.params
          .map(({ key, value }) => {
            const v = interpolate_(value, values, isOptional, isMultiple, true)
            if (!v) return ""
            if (Array.isArray(v)) {
              return v.map((x) => `${key}=${x}`).join("&")
            }

            return `${key}=${v}`
          })
          .filter((x) => x.length > 0)
          .join("&")

        out = out + (query ? `?${query}` : "")
        continue
      }
    }
  }

  return out
}

export function match(ast: AST, path: string): Option.Option<Readonly<Record<string, string | ReadonlyArray<string>>>> {
  const [pathname, queryString = ""] = path.split("?")
  let segments = pathname.split(/\//g)
  if (segments[0] === "") {
    segments = segments.slice(1)
  }
  const astSegments = getAstSegments(ast)
  const query = new URLSearchParams(queryString)
  const match = match_(astSegments, segments, query)
  if (match === null) return Option.none()

  return Option.some(match)
}

function match_(
  astSegments: Array<Array<AST>>,
  pathSegments: Array<string>,
  query: URLSearchParams
) {
  const out: Record<string, string | ReadonlyArray<string>> = {}
  const outCtx: { unnamed: number } = { unnamed: 0 }

  let i = 0
  let j = 0
  for (; i < astSegments.length; i++, j++) {
    const astSegment = astSegments[i]
    const ctx = {
      path: pathSegments[j],
      isOptional: false,
      isMultiple: false
    }

    for (const ast of astSegment) {
      switch (ast._tag) {
        case "Optional": {
          ctx.isOptional = true
          astSegment.push(ast.param as any)
          continue
        }
        case "OneOrMore": {
          ctx.isMultiple = true
          astSegment.push(ast.param as any)
          continue
        }
        case "ZeroOrMore": {
          ctx.isOptional = true
          ctx.isMultiple = true
          astSegment.push(ast.param as any)
          continue
        }
        case "Literal": {
          if (ast.literal !== ctx.path) {
            throw Error(`Expected literal: ${ast.literal} but received: ${ctx.path}`)
          }
          continue
        }
        case "Prefix": {
          if (!ctx.path.startsWith(ast.prefix)) {
            throw Error(`Expected prefix: ${ast.prefix} but received: ${ctx.path}`)
          }

          ctx.path = ctx.path.slice(ast.prefix.length)
          astSegment.push(ast.param as any)
          continue
        }
        case "Param": {
          const value = ctx.path
          if (ctx.isOptional && !value) continue
          if (!value) {
            throw new Error(`Missing value for param: ${ast.param}`)
          }

          if (ctx.isMultiple) {
            out[ast.param] = [value, ...pathSegments.slice(j + 1)]
            j = pathSegments.length
            return out
          }

          out[ast.param] = value
          continue
        }
        case "UnnamedParam": {
          const value = ctx.path
          if (ctx.isOptional && value === undefined) continue
          if (value === undefined) {
            throw new Error(`Missing value for param: ${outCtx.unnamed}`)
          }

          out[outCtx.unnamed++] = value
          continue
        }
        case "QueryParams": {
          const currentCtx = { ...ctx }

          for (const { key, value } of ast.params) {
            const parts = toParts(value)
            let values = query.getAll(key)
            const ctx = { ...currentCtx }

            for (const part of parts) {
              switch (part._tag) {
                case "Optional": {
                  ctx.isOptional = true
                  parts.push(part.param as any)
                  break
                }
                case "OneOrMore": {
                  ctx.isMultiple = true
                  parts.push(part.param as any)
                  break
                }
                case "ZeroOrMore": {
                  ctx.isOptional = true
                  ctx.isMultiple = true
                  parts.push(part.param as any)
                  break
                }
                case "Prefix": {
                  if (values.every((v) => v.startsWith(part.prefix))) {
                    throw new Error(`Expected prefix: ${part.prefix} but received: ${values[0]}`)
                  }

                  values = values.map((p) => p.slice(part.prefix.length))
                  parts.push(part.param as any)
                  break
                }
                case "Literal": {
                  if (values.length === 0) {
                    if (ctx.isOptional) break
                    throw new Error(`Missing value for query param: ${key}`)
                  }

                  const value = values.shift()!
                  if (value !== part.literal) {
                    throw new Error(`Expected literal: ${part.literal} but received: ${value}`)
                  }

                  break
                }
                case "Param": {
                  if (values.length === 0) {
                    if (ctx.isOptional) break
                    throw new Error(`Missing value for query param: ${key}`)
                  }

                  const value = values.shift()!
                  if (ctx.isMultiple) {
                    out[key] = [value, ...values]
                    return out
                  }

                  out[key] = value
                  break
                }
                case "UnnamedParam": {
                  if (values.length === 0) {
                    if (ctx.isOptional) break
                    throw new Error(`Missing value for query param: ${key}`)
                  }

                  const value = values.shift()!
                  out[outCtx.unnamed++] = value
                  break
                }
                case "WithSchema": {
                  parts.push(part.ast)
                  break
                }
                default: {
                  throw new Error(`Invalid AST part in Query Param: ${part._tag}`)
                }
              }
            }
          }

          continue
        }
        case "WithSchema": {
          astSegment.push(ast.ast)
          continue
        }
      }
    }
  }

  return out
}

export function getAstSegments(part: AST): Array<Array<AST>> {
  const out: Array<Array<AST>> = []

  let current: Array<AST> = []

  switch (part._tag) {
    case "Literal": {
      if (part.literal === "/") {
        break
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
