import { run, Sync } from '../../src/Prelude/Sync'
import {
  DynamicFunctionParam,
  DynamicTypeParam,
  FunctionParam,
  FunctionReturnSignature,
  FunctionSignature,
  HKTParam,
  HKTPlaceholder,
  Interface,
  InterfaceProperty,
  Kind,
  KindParam,
  KindReturn,
  ObjectNode,
  ObjectProperty,
  ParentNode,
  StaticFunctionParam,
  StaticNode,
  StaticTypeParam,
  Tuple,
  TupleReturn,
  TypeAlias,
  Typeclass,
  TypeParam,
} from './AST'
import { hktParamNames } from './common'
import { buildContext, Context } from './Context'
import { findHKTParams } from './findHKTParams'
import { findPossibilities } from './findPossibilities'

export function generateOverloads(ast: ParentNode) {
  return run(generateOverloadsSafe(ast))
}

export function generateOverloadsSafe(
  ast: ParentNode,
): Sync<ReadonlyArray<readonly [ParentNode, Context]>> {
  return Sync(function* () {
    switch (ast.tag) {
      case FunctionSignature.tag:
        return (yield* generateFunctionSignatureOverloads(ast)).reverse()
      case Interface.tag:
        return yield* generateInterfaceOverloads(ast)
      case TypeAlias.tag:
        return yield* generateTypeAliasOverloads(ast)
    }
  })
}

export function generateFunctionSignatureOverloads(signature: FunctionSignature) {
  const possiblilties = findPossibilities(signature)

  return Sync(function* () {
    const output: Array<readonly [FunctionSignature, Context]> = []

    for (const possiblilty of possiblilties) {
      const context = buildContext(signature, possiblilty)

      output.push([yield* generateFunctionSignature(signature, context), context])
    }

    return output
  })
}

export function generateInterfaceOverloads(node: Interface) {
  const possiblilties = findPossibilities(node)

  return Sync(function* () {
    const output: Array<readonly [Interface, Context]> = []

    for (const possiblilty of possiblilties) {
      const context = buildContext(node, possiblilty)

      output.push([yield* generateInterface(node, context), context])
    }

    return output
  })
}

export function generateTypeAliasOverloads(node: TypeAlias) {
  const possiblilties = findPossibilities(node)

  return Sync(function* () {
    const output: Array<readonly [TypeAlias, Context]> = []

    for (const possiblilty of possiblilties) {
      const context = buildContext(node, possiblilty)

      output.push([yield* generateTypeAlias(node, context), context])
    }

    return output
  })
}

export function generateFunctionSignature(signature: FunctionSignature, context: Context) {
  return Sync(function* () {
    return new FunctionSignature(
      signature.name,
      yield* generateTypeParams(signature.typeParams, context),
      yield* generateFunctionParams(signature.functionParams, context),
      yield* generateReturnSignature(signature.returnSignature, context),
    )
  })
}

export function generateReturnSignature(
  signature: FunctionReturnSignature,
  context: Context,
): Sync<FunctionReturnSignature> {
  return Sync(function* () {
    switch (signature.tag) {
      case FunctionSignature.tag:
        return yield* generateFunctionSignature(signature, context)
      case KindReturn.tag:
        return yield* generateKindReturn(signature, context)
      case TupleReturn.tag: {
        const output: FunctionReturnSignature[] = []

        for (const s of signature.members) {
          output.push(yield* generateReturnSignature(s, context))
        }

        return new TupleReturn(output)
      }
      case DynamicTypeParam.tag:
        return yield* generateDynamicTypeParam(signature, context)
      default:
        return signature
    }
  })
}

export function generateTypeParams(
  params: readonly TypeParam[],
  context: Context,
): Sync<readonly TypeParam[]> {
  return Sync(function* () {
    const output: TypeParam[] = []

    for (const p of params) {
      switch (p.tag) {
        case HKTPlaceholder.tag: {
          output.push(...generatePlaceholders(p, context))
          break
        }
        case HKTParam.tag: {
          output.push(yield* generateHKTParam(p, context))
          break
        }
        case Typeclass.tag: {
          output.push(yield* generateTypeclass(p, context))
          break
        }
        case DynamicTypeParam.tag: {
          output.push(yield* generateDynamicTypeParam(p, context))

          break
        }
        default: {
          output.push(p)
          break
        }
      }
    }

    return output
  })
}

export function generatePlaceholders(p: HKTPlaceholder, context: Context) {
  const length = context.lengths.get(p.type.id)!
  const existing = findExistingParams(context, p.type.id)
  const position = context.positions.get(p.type.id)!
  const multiple = context.lengths.size > 1

  if (length === 0) {
    return []
  }

  const params = hktParamNames.slice(existing, length).reverse()
  const placholders = Array.from({ length: length - existing }, (_, i) => {
    const name = params[i]

    return new StaticTypeParam(
      multiple ? `${name}${position}` : name,
      undefined,
      p.useDefaults ? `${p.type.name}['defaults'][Params.${name}]` : undefined,
    )
  })

  return placholders
}

function findExistingParams(context: Context, id: symbol): number {
  const params = context.existing.get(id)

  if (!params) {
    return 0
  }

  // TODO: Check if multiple values should be here
  return params.length
}

export function generateHKTParam(p: HKTParam, context: Context): Sync<HKTParam> {
  // eslint-disable-next-line require-yield
  return Sync(function* () {
    return {
      ...p,
      size: context.lengths.get(p.id) ?? 0,
    }
  })
}

export function generateTypeclass(p: Typeclass, context: Context): Sync<Typeclass> {
  return Sync(function* () {
    return {
      ...p,
      type: yield* generateHKTParam(p.type, context),
    }
  })
}

export function generateDynamicTypeParam(
  p: DynamicTypeParam,
  context: Context,
): Sync<DynamicTypeParam> {
  return Sync(function* () {
    return new DynamicTypeParam(yield* generateKindParams(p.params, context), p.template)
  })
}

export function generateKind(param: Kind, context: Context): Sync<Kind> {
  return Sync(function* () {
    return {
      ...param,
      typeParams: yield* generateKindParams(param.typeParams, context),
    }
  })
}

export function generateKindParams(params: readonly KindParam[], context: Context) {
  return Sync(function* () {
    const output: KindParam[] = []

    for (const p of params) {
      output.push(...(yield* generateKindParam(p, context)))
    }

    return output
  })
}

export function generateKindParam(param: KindParam, context: Context): Sync<readonly KindParam[]> {
  return Sync(function* () {
    switch (param.tag) {
      case Kind.tag:
        return [yield* generateKind(param, context)]
      case Tuple.tag:
        return [yield* generateTuple(param, context)]
      case ObjectNode.tag:
        return [yield* generateObjectNode(param, context)]
      case StaticNode.tag:
        return [param]
      default:
        return yield* generateTypeParams([param], context)
    }
  })
}

export function generateTuple(tuple: Tuple, context: Context): Sync<Tuple> {
  return Sync(function* () {
    return {
      ...tuple,
      members: yield* generateKindParams(tuple.members, context),
    }
  })
}

export function generateObjectNode(node: ObjectNode, context: Context): Sync<ObjectNode> {
  return Sync(function* () {
    return {
      ...node,
      properties: yield* generateObjectProperties(node.properties, context),
    }
  })
}

export function generateObjectProperties(properties: readonly ObjectProperty[], context: Context) {
  return Sync(function* () {
    const output: ObjectProperty[] = []

    for (const p of properties) {
      output.push(yield* generateObjectProperty(p, context))
    }

    return output
  })
}

export function generateObjectProperty(
  property: ObjectProperty,
  context: Context,
): Sync<ObjectProperty> {
  return Sync(function* () {
    return {
      ...property,
      param: (yield* generateKindParam(property.param, context))[0],
    }
  })
}

export function generateKindReturn(kind: KindReturn, context: Context): Sync<KindReturn> {
  return Sync(function* () {
    return {
      ...kind,
      typeParams: yield* generateKindParams(kind.typeParams, context),
    }
  })
}

export function generateFunctionParams(
  params: readonly FunctionParam[],
  context: Context,
): Sync<readonly FunctionParam[]> {
  return Sync(function* () {
    const output: FunctionParam[] = []

    for (const p of params) {
      output.push(...(yield* generateFunctionParam(p, context)))
    }

    return output
  })
}

export function generateFunctionParam(
  param: FunctionParam,
  context: Context,
): Sync<readonly FunctionParam[]> {
  return Sync(function* () {
    switch (param.tag) {
      case Kind.tag:
        return [yield* generateKind(param, context)]
      case StaticFunctionParam.tag:
        return [param]
      case DynamicFunctionParam.tag:
        return [yield* generateDynamicFunctionParam(param, context)]
      case Typeclass.tag:
        return [yield* generateTypeclass(param, context)]
      case FunctionSignature.tag:
        return [yield* generateFunctionSignature(param, context)]
    }
  })
}

function generateDynamicFunctionParam(
  param: DynamicFunctionParam,
  context: Context,
): Sync<DynamicFunctionParam> {
  return Sync(function* () {
    return {
      ...param,
      typeParams: yield* generateTypeParams(param.typeParams, context),
    }
  })
}

export function generateInterface(node: Interface, context: Context): Sync<Interface> {
  return Sync(function* () {
    const extensions: Array<Interface | KindParam> = []

    for (const e of node.extensions) {
      extensions.push(
        ...(e.tag === Interface.tag
          ? [yield* generateInterface(e, context)]
          : yield* generateKindParam(e, context)),
      )
    }

    return new Interface(
      generateTypeName(node, context),
      yield* generateTypeParams(node.typeParams, context),
      yield* generateProperties(node.properties, context),
      extensions,
    )
  })
}

function generateTypeName(node: Interface | TypeAlias, context: Context): string {
  return `${node.name}${generatePostfix(findHKTParams(node.typeParams), context)}`
}

function generatePostfix(hktParams: readonly HKTParam[], context: Context) {
  return hktParams
    .map((p) => `${context.lengths.get(p.id) === 0 ? '' : context.lengths.get(p.id) ?? ''}`)
    .join('')
}

export function generateProperties(
  properties: readonly InterfaceProperty[],
  context: Context,
): Sync<readonly InterfaceProperty[]> {
  return Sync(function* () {
    const output: InterfaceProperty[] = []

    for (const p of properties) {
      output.push(yield* generateProperty(p, context))
    }

    return output
  })
}

export function generateProperty(p: InterfaceProperty, context: Context): Sync<InterfaceProperty> {
  return Sync(function* () {
    return {
      ...p,
      signature: yield* generateFunctionSignature(p.signature, context),
    }
  })
}

export function generateTypeAlias(node: TypeAlias, context: Context): Sync<TypeAlias> {
  return Sync(function* () {
    return {
      ...node,
      name: generateTypeName(node, context),
      typeParams: yield* generateTypeParams(node.typeParams, context),
      signature: yield* generateReturnSignature(node.signature, context),
    }
  })
}
