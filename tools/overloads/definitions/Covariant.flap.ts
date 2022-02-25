import {
  FunctionSignature,
  HKTParam,
  HKTPlaceholder,
  Kind,
  KindReturn,
  StaticFunctionParam,
  StaticTypeParam,
  Typeclass,
} from '../AST'

export const hkt = new HKTParam('T')
export const aTypeParam = new StaticTypeParam('A')
export const bTypeParam = new StaticTypeParam('B')
export const placholder = new HKTPlaceholder(hkt)

export const node = new FunctionSignature(
  'flap',
  [hkt],
  [new Typeclass('C', 'Covariant', hkt)],
  new FunctionSignature(
    '',
    [aTypeParam],
    [new StaticFunctionParam('a', 'A')],
    new FunctionSignature(
      '',
      [placholder, bTypeParam],
      [new Kind('kind', hkt, [placholder, new StaticTypeParam(`(a: A) => B`)])],
      new KindReturn(hkt, [placholder, bTypeParam]),
    ),
  ),
)
