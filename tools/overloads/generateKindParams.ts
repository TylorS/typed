import { Kind, KindParam, Tuple } from './AST'
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
