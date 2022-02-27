import {
  DynamicFunctionParam,
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
  StaticFunctionParam,
  StaticNode,
  StaticReturn,
  StaticTypeParam,
  Tuple,
  Typeclass,
  TypeParam,
} from './AST'
import { Context } from './Context'

export function printOverload(node: FunctionSignature | Interface, context: Context): string {
  switch (node.tag) {
    case FunctionSignature.tag:
      return printFunctionSignature(node, context, false)
    case Interface.tag:
      return printInterface(node, context)
  }
}

export function printInterface(node: Interface, context: Context): string {
  return `export interface ${node.name}${
    node.typeParams.length
      ? `<${node.typeParams.map((p) => printTypeParam(p, false)).join(', ')}>`
      : ''
  } {
  ${node.properties.map((p) => printProperty(p, context))}
}`
}

export function printProperty(property: InterfaceProperty, context: Context): string {
  return `readonly ${property.name}: ${printFunctionSignature(property.signature, context, true)}`
}

export function printFunctionSignature(
  node: FunctionSignature,
  context: Context,
  isReturn: boolean,
): string {
  let s = ''

  if (!isReturn) {
    s += `export function ${node.name}`
  }

  if (node.typeParams.length) {
    s += '<'
    s += node.typeParams.map((p) => printTypeParam(p, false)).join(', ')
    s += '>'
  }

  s += '('
  if (node.functionParams.length) {
    s += node.functionParams.map((p) => printFunctionParam(p, context)).join(', ')
  }
  s += ')'

  s += isReturn ? ' => ' : ': '

  s += printReturnSignature(node.returnSignature, context)

  return s
}

export function printTypeParam(p: TypeParam, printStatic: boolean): string {
  switch (p.tag) {
    case HKTParam.tag:
      return printStatic ? p.name : `${p.name} extends HKT${p.size < 2 ? '' : `${p.size}`}`
    case HKTPlaceholder.tag: // Should be replaced in Overloads with StaticTypeParams
      return ''
    case Typeclass.tag: {
      const baseName = `${p.name}${p.type.size === 0 ? '' : p.type.size}`

      return printStatic ? baseName : `${baseName}<${p.type.name}>`
    }

    case StaticTypeParam.tag: {
      if (printStatic) {
        return p.type
      }

      const base = p.extension ? `${p.type} extends ${p.extension}` : p.type

      return p.defaultValue ? `${base} = ${p.defaultValue}` : base
    }
  }
}

export function printFunctionParam(p: FunctionParam, context: Context): string {
  switch (p.tag) {
    case StaticFunctionParam.tag:
      return `${p.label}: ${p.type}`
    case DynamicFunctionParam.tag:
      return `${p.label}: ${p.template(
        p.typeParams.map((t) => printTypeParam(t, true)),
        context,
      )}`
    case Kind.tag:
      return printKind(p, context, false)
    case Typeclass.tag: {
      return `${p.label}: ${p.name}${p.type.size === 0 ? '' : p.type.size}<${p.type.name}>`
    }
  }
}

export function printReturnSignature(p: FunctionReturnSignature, context: Context): string {
  switch (p.tag) {
    case FunctionSignature.tag:
      return printFunctionSignature(p, context, true)
    case StaticReturn.tag:
      return printStaticReturn(p)
    case KindReturn.tag:
      return printKindReturn(p, context)
  }
}

export function printStaticReturn(p: StaticReturn): string {
  if (p.params.length) {
    return `${p.type}<${p.params.map((p) => printTypeParam(p, true)).join(', ')}>`
  }

  return p.type
}

export function printKindReturn(p: KindReturn, context: Context): string {
  const length = context.lengths.get(p.type.id)!

  return `Kind${length < 2 ? '' : length}<${p.type.name}${
    p.typeParams.length ? ', ' : ''
  }${p.typeParams.map((p) => printKindParam(p, context, true)).join(', ')}>`
}

export function printKind(kind: Kind, context: Context, printStatic: boolean): string {
  const length = context.lengths.get(kind.type.id)!
  const s = `Kind${length < 2 ? '' : length}<${kind.type.name}${
    kind.typeParams.length ? ', ' : ''
  }${kind.typeParams.map((p) => printKindParam(p, context, true)).join(', ')}>`

  return printStatic ? s : `${kind.label}: ${s}`
}

function printKindParam(kindParam: KindParam, context: Context, printStatic: boolean): string {
  switch (kindParam.tag) {
    case Kind.tag:
      return printKind(kindParam, context, printStatic)
    case Tuple.tag:
      return printTuple(kindParam, context)
    case ObjectNode.tag:
      return printObjectNode(kindParam, context)
    case StaticNode.tag:
      return kindParam.type
    default:
      return printTypeParam(kindParam, true)
  }
}

function printTuple(tuple: Tuple, context: Context): string {
  return `readonly [${tuple.members.map((m) => printKindParam(m, context, true)).join(', ')}]`
}

function printObjectNode(node: ObjectNode, context: Context): string {
  return `{
    ${node.properties.map((p) => `readonly ${p.name}: ${printKindParam(p.param, context, true)}`)}
}`
}
