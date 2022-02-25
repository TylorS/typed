import {
  DynamicFunctionParam,
  FunctionSignature,
  HKTParam,
  HKTPlaceholder,
  Kind,
  KindReturn,
  StaticTypeParam,
  Typeclass,
} from '../AST'

export const hktF = new HKTParam('F')
export const hktG = new HKTParam('G')
export const aTypeParam = new StaticTypeParam('A')
export const bTypeParam = new StaticTypeParam('B')
export const placeholderF = new HKTPlaceholder(hktF)
export const placeholderG = new HKTPlaceholder(hktG)

export const node = new FunctionSignature(
  'map',
  [hktF, hktG],
  [new Typeclass('F', 'Covariant', hktF), new Typeclass('G', 'Covariant', hktG)],
  new FunctionSignature(
    '',
    [aTypeParam, bTypeParam],
    [
      new DynamicFunctionParam(
        'f',
        [aTypeParam, bTypeParam] as const,
        ([a, b]) => `Unary<${a}, ${b}>`,
      ),
    ],
    new FunctionSignature(
      '',
      [placeholderF, placeholderG],
      [new Kind('kind', hktF, [placeholderF, new Kind('', hktG, [placeholderG, aTypeParam])])],
      new KindReturn(hktF, [placeholderF, new Kind('', hktG, [placeholderG, bTypeParam])]),
    ),
  ),
)
