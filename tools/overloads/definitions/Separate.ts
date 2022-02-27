import {
  DynamicTypeParam,
  FunctionSignature,
  HKTParam,
  HKTPlaceholder,
  Interface,
  InterfaceProperty,
  Kind,
  KindReturn,
  StaticTypeParam,
  TupleReturn,
} from '../AST'

export const hkt = new HKTParam('T')
export const placeholder = new HKTPlaceholder(hkt)
export const aTypeParam = new StaticTypeParam('A')
export const bTypeParam = new StaticTypeParam('B')

export const node = new Interface(
  'Separate',
  [hkt],
  [
    new InterfaceProperty(
      'separate',
      new FunctionSignature(
        '',
        [placeholder, aTypeParam, bTypeParam],
        [
          new Kind('kind', hkt, [
            placeholder,
            new DynamicTypeParam([aTypeParam, bTypeParam], ([A, B]) => `Either<${A}, ${B}>`),
          ]),
        ],
        new TupleReturn([
          new KindReturn(hkt, [placeholder, aTypeParam]),
          new KindReturn(hkt, [placeholder, bTypeParam]),
        ]),
      ),
    ),
  ],
)
