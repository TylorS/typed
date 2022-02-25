import { Kind, KindParam, ObjectNode, ObjectProperty, Tuple } from './AST'
import { Context } from './Context'
import { generateTypeParams } from './generateTypeParams'

export function generateKind(param: Kind, context: Context): Kind {
  return {
    ...param,
    typeParams: generateKindParams(param.typeParams, context),
  }
}

export function generateKindParams(params: readonly KindParam[], context: Context) {
  return params.flatMap((p) => generateKindParam(p, context))
}

export function generateKindParam(param: KindParam, context: Context): readonly KindParam[] {
  switch (param.tag) {
    case Kind.tag:
      return [generateKind(param, context)]
    case Tuple.tag:
      return [generateTuple(param, context)]
    case ObjectNode.tag:
      return [generateObjectNode(param, context)]
    default:
      return generateTypeParams([param], context) as readonly KindParam[]
  }
}

export function generateTuple(tuple: Tuple, context: Context): Tuple {
  return {
    ...tuple,
    members: generateKindParams(tuple.members, context),
  }
}

export function generateObjectNode(node: ObjectNode, context: Context): ObjectNode {
  return {
    ...node,
    properties: generateObjectProperties(node.properties, context),
  }
}

export function generateObjectProperties(properties: readonly ObjectProperty[], context: Context) {
  return properties.map((p) => generateObjectProperty(p, context))
}

export function generateObjectProperty(property: ObjectProperty, context: Context): ObjectProperty {
  return {
    ...property,
    param: generateKindParam(property.param, context)[0],
  }
}
