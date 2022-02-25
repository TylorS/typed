import { HKTParam, HKTPlaceholder, StaticTypeParam, Typeclass, TypeParam } from './AST'
import { hktParamNames } from './common'
import { Context } from './Context'

export function generateTypeParams(
  params: readonly TypeParam[],
  context: Context,
): readonly TypeParam[] {
  return params.flatMap((p): readonly TypeParam[] => {
    switch (p.tag) {
      case HKTPlaceholder.tag:
        return generatePlaceholders(p, context)
      case HKTParam.tag:
        return [generateHKTParam(p, context)]
      case Typeclass.tag:
        return [generateTypeclass(p, context)]
      default:
        return [p]
    }
  })
}

export function generatePlaceholders(p: HKTPlaceholder, context: Context) {
  const length = context.lengths.get(p.type.id)!
  const existing = context.existing.get(p.type.id)?.length ?? 0
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

export function generateHKTParam(p: HKTParam, context: Context): HKTParam {
  return {
    ...p,
    size: context.lengths.get(p.id) ?? 0,
  }
}

export function generateTypeclass(p: Typeclass, context: Context): Typeclass {
  return {
    ...p,
    type: generateHKTParam(p.type, context),
  }
}
