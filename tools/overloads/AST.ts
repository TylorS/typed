import type { Context } from './Context'

export type AST =
  | Interface
  | Property
  | FunctionSignature
  | TypeParam
  | FunctionParam
  | KindParam
  | FunctionReturnSignature

export const ast = <T extends string>(tag: T) =>
  class Node {
    static tag = tag
    readonly tag = tag
    readonly id = Symbol(tag)
  }

export class Interface extends ast('Interface') {
  constructor(
    readonly name: string,
    readonly typeParams: ReadonlyArray<TypeParam>,
    readonly properties: ReadonlyArray<Property>,
  ) {
    super()
  }
}

export class Property extends ast('Property') {
  constructor(readonly name: string, readonly signature: FunctionSignature) {
    super()
  }
}

export class FunctionSignature extends ast('FunctionSignature') {
  constructor(
    readonly name: string,
    readonly typeParams: ReadonlyArray<TypeParam>,
    readonly functionParams: ReadonlyArray<FunctionParam>,
    readonly returnSignature: FunctionReturnSignature,
  ) {
    super()
  }
}

export type TypeParam = HKTParam | HKTPlaceholder | StaticTypeParam

export class HKTParam extends ast('HKTParam') {
  constructor(readonly name: string, readonly size = 0) {
    super()
  }
}

export class HKTPlaceholder extends ast('HKTPlaceholder') {
  constructor(readonly type: HKTParam, readonly useDefaults: boolean = false) {
    super()
  }
}

export class StaticTypeParam extends ast('StaticTypeParam') {
  constructor(readonly type: string, readonly extension?: string, readonly defaultValue?: string) {
    super()
  }
}

export type FunctionParam = StaticFunctionParam | DynamicFunctionParam | Kind

export class StaticFunctionParam extends ast('StaticFunctionParam') {
  constructor(readonly label: string, readonly type: string) {
    super()
  }
}

export class DynamicFunctionParam extends ast('DynamicFunctionParam') {
  constructor(
    readonly label: string,
    readonly typeParams: readonly TypeParam[],
    readonly template: (typeParams: readonly string[], context: Context) => string,
  ) {
    super()
  }
}

export class Kind extends ast('Kind') {
  constructor(
    readonly label: string,
    readonly type: HKTParam,
    readonly typeParams: ReadonlyArray<KindParam>,
  ) {
    super()
  }
}

export type KindParam = Exclude<TypeParam | Kind | Tuple, HKTParam>

export type FunctionReturnSignature = FunctionSignature | KindReturn | StaticReturn

export class KindReturn extends ast('KindReturn') {
  constructor(readonly type: HKTParam, readonly typeParams: ReadonlyArray<KindParam>) {
    super()
  }
}

export class StaticReturn extends ast('StaticReturn') {
  constructor(readonly type: string, readonly params: readonly TypeParam[]) {
    super()
  }
}

export class Tuple extends ast('Tuple') {
  constructor(readonly members: ReadonlyArray<KindParam>) {
    super()
  }
}
