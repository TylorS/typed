import { HKTParam, TypeParam } from './AST'

export function findHKTParams(params: readonly TypeParam[]) {
  return params.filter(isHKTParam)
}

export function isHKTParam(param: TypeParam): param is HKTParam {
  return param.tag === HKTParam.tag
}
