import { FunctionSignature, Interface, ParentNode, TypeAlias } from './AST'
import { combinations, possibleLengths, uniq } from './common'
import { findHKTParams } from './findHKTParams'

export function findPossibilities(ast: ParentNode): ReadonlyArray<ReadonlyArray<number>> {
  switch (ast.tag) {
    case FunctionSignature.tag:
      return uniq(combinations(findHKTParams(ast.typeParams).map(() => possibleLengths)))
    case Interface.tag:
      return uniq(combinations(findHKTParams(ast.typeParams).map(() => possibleLengths)))
    case TypeAlias.tag:
      return uniq(combinations(findHKTParams(ast.typeParams).map(() => possibleLengths)))
  }
}
