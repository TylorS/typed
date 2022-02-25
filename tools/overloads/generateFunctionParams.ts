import { DynamicFunctionParam, FunctionParam, Kind, StaticFunctionParam } from './AST'
import { Context } from './Context'
import { generateKind } from './generateKindParams'
import { generateTypeParams } from './generateTypeParams'

export function generateFunctionParams(
  params: readonly FunctionParam[],
  context: Context,
): readonly FunctionParam[] {
  return params.map((p) => generateFunctionParam(p, context))
}

export function generateFunctionParam(param: FunctionParam, context: Context): FunctionParam {
  switch (param.tag) {
    case Kind.tag:
      return generateKind(param, context)
    case StaticFunctionParam.tag:
      return param
    case DynamicFunctionParam.tag:
      return generateDynamicFunctionParam(param, context)
  }
}

function generateDynamicFunctionParam(
  param: DynamicFunctionParam,
  context: Context,
): DynamicFunctionParam {
  return {
    ...param,
    typeParams: generateTypeParams(param.typeParams, context),
  }
}
