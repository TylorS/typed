import {
  DynamicFunctionParam,
  FunctionSignature,
  HKTParam,
  HKTPlaceholder,
  Interface,
  InterfaceProperty,
  Kind,
  KindReturn,
  StaticTypeParam,
} from '../AST'

export const hkt = new HKTParam('T')
export const aTypeParam = new StaticTypeParam('A')
export const bTypeParam = new StaticTypeParam('B')
export const placeholder = new HKTPlaceholder(hkt)

export const node = new Interface(
  'Covariant',
  [hkt],
  [
    new InterfaceProperty(
      'map',
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
          [placeholder],
          [new Kind('kind', hkt, [placeholder, aTypeParam])],
          new KindReturn(hkt, [placeholder, bTypeParam]),
        ),
      ),
    ),
  ],
)
