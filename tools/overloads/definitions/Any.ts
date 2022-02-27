import {
  FunctionSignature,
  HKTParam,
  HKTPlaceholder,
  Interface,
  InterfaceProperty,
  KindReturn,
  StaticTypeParam,
} from '../AST'

export const hkt = new HKTParam('T')
export const placeholder = new HKTPlaceholder(hkt, true)

export const node = new Interface(
  'Any',
  [hkt],
  [
    new InterfaceProperty(
      'any',
      new FunctionSignature(
        '',
        [placeholder],
        [],
        new KindReturn(hkt, [placeholder, new StaticTypeParam('unknown')]),
      ),
    ),
  ],
)
