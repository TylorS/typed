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
export const placholder = new HKTPlaceholder(hkt, true)
export const aTypeParam = new StaticTypeParam('A')
export const aFunctionParam = new StaticFunctionParam('value', 'A')

export const node = new Interface(
  'Pointed',
  [hkt],
  [
    new InterfaceProperty(
      'of',
      new FunctionSignature(
        '',
        [aTypeParam, placholder],
        [aFunctionParam],
        new KindReturn(hkt, [placholder, aTypeParam]),
      ),
    ),
  ],
)