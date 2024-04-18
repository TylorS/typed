import { Schema } from "@effect/schema"
import { PropertySignature, TypeLiteral } from "@effect/schema/AST"
import * as P from "@typed/path"

export type AST =
  | AST.Base
  | QueryParams<ReadonlyArray<QueryParam<any, AST.Base>>>
  | Concat<AST, AST>
  | WithSchema<AST, Schema.Schema.All>

export namespace AST {
  export type Base =
    | Literal<any>
    | UnnamedParam
    | Param<any>
    | ZeroOrMore<any>
    | OneOrMore<any>
    | Optional<AST>
    | Prefix<any, AST>
}

export class Literal<L extends string> {
  readonly _tag = "Literal" as const
  constructor(readonly literal: L) {}
}

export class UnnamedParam {
  readonly _tag = "UnnamedParam" as const
}

export class Param<P extends string> {
  readonly _tag = "Param" as const
  constructor(readonly param: P) {}
}

export class ZeroOrMore<P extends AST> {
  readonly _tag = "ZeroOrMore" as const
  constructor(readonly param: P) {}
}

export class OneOrMore<P extends AST> {
  readonly _tag = "OneOrMore" as const
  constructor(readonly param: P) {}
}

export class Optional<P extends AST> {
  readonly _tag = "Optional" as const
  constructor(readonly param: P) {}
}

export class Prefix<P extends string, A extends AST> {
  readonly _tag = "Prefix" as const
  constructor(readonly prefix: P, readonly param: A) {}
}

export class Concat<L extends AST, R extends AST> {
  readonly _tag = "Concat" as const
  constructor(readonly left: L, readonly right: R) {}
}

export class WithSchema<A extends AST, S extends Schema.Schema.All> {
  readonly _tag = "WithSchema" as const
  constructor(readonly ast: A, readonly schema: S) {}
}

export class QueryParams<P extends ReadonlyArray<QueryParam<any, any>>> {
  readonly _tag = "QueryParams" as const
  constructor(readonly params: P) {}
}

export class QueryParam<K extends string, V extends AST.Base> {
  readonly _tag = "QueryParam" as const
  constructor(readonly key: K, readonly value: V) {}
}

const pathCache = new WeakMap<AST, string>()
const schemaCache = new WeakMap<AST, Schema.Schema.All>()

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
      return P.queryParams(ast.params.map(({ key, value }) => P.queryParam(key, toPath_(value))))
  }
}

export function toPath<A extends AST>(ast: A): string {
  const cached = pathCache.get(ast)
  if (cached) {
    return cached
  }

  const path = P.pathJoin(toPath_(ast))
  pathCache.set(ast, path)

  return path
}

function toSchemas<A extends AST>(ast: A, ctx: { unnamed: number } = { unnamed: 0 }): Array<Schema.Schema.All> {
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
      return toSchemas(ast.param, ctx).map(zeroOrMoreSchema)
    case "OneOrMore":
      return toSchemas(ast.param, ctx).map(oneOrMoreSchema)
    case "Prefix":
      return toSchemas(ast.param, ctx)
    case "Optional":
      return toSchemas(ast.param, ctx).map(orUndefinedSchema)
    case "Concat":
      return [...toSchemas(ast.left, ctx), ...toSchemas(ast.right, ctx)]
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
      return ast.params.flatMap(({ value }) => toSchemas(value, ctx))
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

function toSchema_<A extends AST>(ast: A): Schema.Schema.All {
  const schemas = toSchemas(ast)

  if (schemas.length === 0) {
    return Schema.Record(Schema.String, Schema.Unknown)
  }

  return schemas.reduce(Schema.extend)
}

export function toSchema<A extends AST>(ast: A): Schema.Schema.All {
  const cached = schemaCache.get(ast)
  if (cached) {
    return cached
  }

  const schema = toSchema_(ast)
  schemaCache.set(ast, schema)

  return schema
}
