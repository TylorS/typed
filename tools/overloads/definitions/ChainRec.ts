import {
  FunctionSignature,
  HKTParam,
  HKTPlaceholder,
  Interface,
  InterfaceProperty,
  KindReturn,
  StaticFunctionParam,
  StaticTypeParam,
} from '../AST'

export const hkt = new HKTParam('T')
export const placeholder = new HKTPlaceholder(hkt)
export const aTypeParam = new StaticTypeParam('A')
export const bTypeParam = new StaticTypeParam('B')

export const node = new Interface(
  'ChainRec',
  [hkt],
  [
    new InterfaceProperty(
      'chainRec',
      new FunctionSignature(
        '',
        [aTypeParam, placeholder, bTypeParam],
        [
          new FunctionSignature(
            'f',
            [],
            [new StaticFunctionParam('a', 'A')],
            new KindReturn(hkt, [placeholder, new StaticTypeParam('Either<A, B>')]),
          ),
        ],
        new KindReturn(hkt, [placeholder, bTypeParam]),
      ),
    ),
  ],
)
