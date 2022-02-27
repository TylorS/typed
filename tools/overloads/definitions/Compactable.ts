import { HKTParam, Interface } from '../AST'
import { node as Compact } from './Compact'
import { node as Separate } from './Separate'

export const hkt = new HKTParam('T')

export const node = new Interface(
  'Compactable',
  [hkt],
  [],
  [
    { ...Compact, typeParams: [hkt] },
    { ...Separate, typeParams: [hkt] },
  ],
)
